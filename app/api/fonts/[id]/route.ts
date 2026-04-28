/**
 * DELETE /api/fonts/[id] — delete a font
 * Mirrors: FontController::delete()
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()

  // Get font path before deletion
  const { data: font } = await serviceClient
    .from('fonts')
    .select('path')
    .eq('id', parseInt(id))
    .single()

  const { error } = await serviceClient.from('fonts').delete().eq('id', parseInt(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Delete from storage
  if (font?.path) {
    await serviceClient.storage.from('fonts').remove([font.path])
  }

  return NextResponse.json({ success: true })
}
