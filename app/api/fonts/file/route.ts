/**
 * GET /api/fonts/file?path=... — serve a font file from Supabase Storage
 *
 * Used by the @font-face CSS rules injected in the admin layout.
 * Returns the raw font bytes with the correct Content-Type header so
 * the browser can load the font for both the template editor and preview.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const MIME: Record<string, string> = {
  ttf:   'font/ttf',
  otf:   'font/otf',
  woff:  'font/woff',
  woff2: 'font/woff2',
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  if (!path) return new NextResponse('path required', { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase.storage.from('fonts').download(path)

  if (error || !data) {
    return new NextResponse('Font not found', { status: 404 })
  }

  const ext = path.split('.').pop()?.toLowerCase() ?? 'ttf'
  const mimeType = MIME[ext] ?? 'application/octet-stream'

  const bytes = await data.arrayBuffer()

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
