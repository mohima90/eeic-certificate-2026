import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendGroupCertificates } from '@/lib/email/sendGroupCertificates'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { group_id, template_id } = body

  if (!group_id)    return NextResponse.json({ error: 'group_id is required.' }, { status: 422 })
  if (!template_id) return NextResponse.json({ error: 'template_id is required.' }, { status: 422 })

  const serviceClient = createServiceClient()

  // Check if already exists (avoid duplicate)
  const { data: existing } = await serviceClient
    .from('enrollment_templates')
    .select('*')
    .eq('group_id', group_id)
    .eq('template_id', template_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ enrollmentTemplate: existing }, { status: 200 })
  }

  const { data: enrollmentTemplate, error } = await serviceClient
    .from('enrollment_templates')
    .insert({ group_id, template_id })
    .select(`*, groups(id,name), templates(id,name)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const emailResult = await sendGroupCertificates(group_id, template_id)

  return NextResponse.json({ enrollmentTemplate, emailResult }, { status: 201 })
}
