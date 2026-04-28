/**
 * GET /api/groups/[id]/export — export group students as Excel
 * Mirrors: GroupController::export()
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportGroupToExcel } from '@/lib/excel/export'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const groupRes = await supabase.from('groups').select('name').eq('id', parseInt(id)).single()
  const group = groupRes.data as { name: string } | null
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = await exportGroupToExcel(parseInt(id))

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${group.name}.xlsx"`,
    },
  })
}
