/**
 * GET    /api/groups/[id] — get group (for edit page)
 * PUT    /api/groups/[id] — update group name
 * DELETE /api/groups/[id] — delete group
 * Mirrors: GroupController::show/update/destroy()
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: group } = await supabase.from('groups').select('*').eq('id', parseInt(id)).single()
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ group })
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const name = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 422 })

  const serviceClient = createServiceClient()

  // Check uniqueness (excluding self)
  const { data: existing } = await serviceClient
    .from('groups').select('id').eq('name', name).neq('id', parseInt(id)).maybeSingle()
  if (existing) return NextResponse.json({ error: `Group name "${name}" is already taken.` }, { status: 422 })

  const { data: group, error } = await serviceClient
    .from('groups').update({ name }).eq('id', parseInt(id)).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ group })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const groupId = parseInt(id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()

  // Collect student IDs before deletion
  const { data: enrollments } = await serviceClient
    .from('enrollments')
    .select('student_id')
    .eq('group_id', groupId)

  const studentIds = (enrollments ?? []).map(e => e.student_id)

  // Delete the group — cascades to enrollments automatically
  const { error } = await serviceClient.from('groups').delete().eq('id', groupId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Delete students who now have no remaining enrollments in any other group
  if (studentIds.length > 0) {
    const { data: remaining } = await serviceClient
      .from('enrollments')
      .select('student_id')
      .in('student_id', studentIds)

    const stillEnrolled = new Set((remaining ?? []).map(e => e.student_id))
    const toDelete = studentIds.filter(sid => !stillEnrolled.has(sid))

    if (toDelete.length > 0) {
      await serviceClient.from('students').delete().in('id', toDelete)
    }
  }

  return NextResponse.json({ success: true })
}
