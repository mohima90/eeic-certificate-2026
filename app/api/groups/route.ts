/**
 * POST /api/groups — create group + import Excel
 * Mirrors: GroupController::store()
 *
 * Validation:
 *   - name: required, unique
 *   - file: required, xlsx only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { importGroupFromExcel } from '@/lib/excel/import'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const name = (formData.get('name') as string)?.trim()
  const file = formData.get('file') as File | null

  if (!name) return NextResponse.json({ error: 'Group name is required.' }, { status: 422 })
  if (!file)  return NextResponse.json({ error: 'Excel file is required.' }, { status: 422 })

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'xlsx' && ext !== 'csv') return NextResponse.json({ error: 'Only .xlsx and .csv files are allowed.' }, { status: 422 })

  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: 'File must not exceed 10MB.' }, { status: 422 })

  const serviceClient = createServiceClient()

  // Check uniqueness
  const { data: existing } = await serviceClient.from('groups').select('id').eq('name', name).maybeSingle()
  if (existing) return NextResponse.json({ error: `Group name "${name}" is already taken.` }, { status: 422 })

  // Create group
  const { data: group, error: groupError } = await serviceClient
    .from('groups')
    .insert({ name })
    .select()
    .single()

  if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 })

  // Import Excel/CSV
  const bytes = await file.arrayBuffer()
  const { imported, errors } = await importGroupFromExcel(bytes, group.id, ext!)

  return NextResponse.json({ group, imported, errors }, { status: 201 })
}
