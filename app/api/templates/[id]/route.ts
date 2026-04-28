/**
 * DELETE /api/templates/[id] — delete template + files
 * Mirrors: TemplateController::destroy()
 * Fixes original: typo "template_imag" prevented file cleanup
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()

  // Get template data before deletion (to clean up files)
  const { data: template } = await serviceClient
    .from('templates')
    .select('image, options')
    .eq('id', parseInt(id))
    .single()

  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete record
  const { error } = await serviceClient.from('templates').delete().eq('id', parseInt(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Delete template image from storage
  if (template.image) {
    await serviceClient.storage.from('templates').remove([template.image])
  }

  // Delete signature files from storage
  const options = template.options as any
  const signatures: any[] = options?.signatures ?? []
  const sigPaths = signatures.map((s: any) => s.content).filter(Boolean)
  if (sigPaths.length > 0) {
    await serviceClient.storage.from('signatures').remove(sigPaths)
  }

  return NextResponse.json({ success: true })
}
