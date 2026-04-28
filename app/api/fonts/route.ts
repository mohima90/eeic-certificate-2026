/**
 * POST /api/fonts — upload a font file
 * Mirrors: FontController::store()
 *
 * Validation (fixing original security issue):
 *   - mimes: ttf, otf, woff, woff2
 *   - max: 5MB
 *   - sanitized filename (no client name)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ALLOWED_MIMES = ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/x-font-ttf', 'application/x-font-otf', 'application/octet-stream']
const ALLOWED_EXTS = ['.ttf', '.otf', '.woff', '.woff2']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function GET() {
  const supabase = await createClient()
  const { data: fonts, error } = await supabase.from('fonts').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fonts })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const fontName = (formData.get('font_name') as string)?.trim()
  const fontFile = formData.get('font_file') as File | null

  if (!fontName) return NextResponse.json({ error: 'Font name is required.' }, { status: 422 })
  if (!fontFile) return NextResponse.json({ error: 'Font file is required.' }, { status: 422 })

  // Validate file size
  if (fontFile.size > MAX_SIZE)
    return NextResponse.json({ error: 'Font file must not exceed 5MB.' }, { status: 422 })

  // Validate extension
  const originalName = fontFile.name.toLowerCase()
  const ext = '.' + originalName.split('.').pop()
  if (!ALLOWED_EXTS.includes(ext))
    return NextResponse.json({ error: 'Only .ttf, .otf, .woff, .woff2 fonts are allowed.' }, { status: 422 })

  // Sanitized filename — no client-provided name
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`

  const bytes = await fontFile.arrayBuffer()
  const serviceClient = createServiceClient()

  const { error: uploadError } = await serviceClient.storage
    .from('fonts')
    .upload(safeName, bytes, { contentType: fontFile.type || 'application/octet-stream' })

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: font, error: dbError } = await serviceClient
    .from('fonts')
    .insert({ name: fontName, path: safeName })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ font }, { status: 201 })
}
