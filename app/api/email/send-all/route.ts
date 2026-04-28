import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendGroupCertificates } from '@/lib/email/sendGroupCertificates'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { group_id, template_id } = body

  if (!group_id || !template_id)
    return NextResponse.json({ error: 'group_id and template_id are required.' }, { status: 422 })

  const results = await sendGroupCertificates(group_id, template_id)
  return NextResponse.json(results)
}
