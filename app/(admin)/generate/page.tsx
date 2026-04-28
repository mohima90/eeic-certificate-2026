/**
 * Exact match: resources/views/admin/groupTemplate/index.blade.php
 *
 * Columns: ID | Name | Email | NotionalID OR Passport | Phone | Course | Template | Group | Actions
 * DataTable on table id="generate"
 * Modal: #kt_modal_invite_friends (assign template to group)
 *
 * Data mirrors GroupTemplateController::index():
 *   Flat list of all students across all enrollment_templates,
 *   each row = one student × one template × one group
 */

import { createClient } from '@/lib/supabase/server'
import GenerateClient from './GenerateClient'
import { encode } from '@/lib/hashids'

export default async function GeneratePage() {
  const supabase = await createClient()

  const [groupsRes, templatesRes, etRes] = await Promise.all([
    supabase.from('groups').select('id, name').order('name'),
    supabase.from('templates').select('id, name').order('name'),
    supabase
      .from('enrollment_templates')
      .select('id, group_id, template_id, groups(id,name), templates(id,name)')
      .order('created_at', { ascending: false }),
  ])

  const groups              = groupsRes.data    as { id: number; name: string }[] | null
  const templates           = templatesRes.data as { id: number; name: string }[] | null
  const enrollmentTemplates = etRes.data        as any[] | null

  // Build the flat $students array — mirrors GroupTemplateController::index()
  const students: any[] = []

  for (const et of enrollmentTemplates ?? []) {
    const group    = et.groups    as any
    const template = et.templates as any

    const enrollmentsRes = await supabase
      .from('enrollments')
      .select('id, student_name, students(id,name,email,uuid,phone), courses(id,name)')
      .eq('group_id', et.group_id)
    const enrollments = enrollmentsRes.data as any[] | null

    for (const e of enrollments ?? []) {
      const student = e.students as any
      const course  = e.courses  as any
      students.push({
        id:          student?.id,
        name:        e.student_name || student?.name,
        email:       student?.email,
        uuid:        student?.uuid,
        phone:       student?.phone,
        course:      course?.name,
        course_id:   encode(course?.id ?? 0),
        template:    template?.name,
        template_id: encode(template?.id ?? 0),
        group:       group,
        group_id:    encode(group?.id ?? 0),
        student_id:  encode(student?.id ?? 0),
      })
    }
  }

  return (
    <GenerateClient
      students={students}
      groups={groups ?? []}
      templates={templates ?? []}
    />
  )
}
