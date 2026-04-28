/**
 * Excel export logic
 * Mirrors: app/Exports/GroupExport.php
 *
 * Headers: Student Name | Email | National ID OR Passport ID | Phone | Course Name
 * Column widths: A=25, B=25, C=25, D=50, E=50 (characters)
 */

import ExcelJS from 'exceljs'
import { createServiceClient } from '@/lib/supabase/server'

export async function exportGroupToExcel(groupId: number): Promise<Buffer> {
  const supabase = createServiceClient()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      student_name,
      students ( name, email, uuid, phone ),
      courses   ( name )
    `)
    .eq('group_id', groupId)

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Group')

  sheet.columns = [
    { header: 'Student Name',               key: 'student_name', width: 25 },
    { header: 'Email',                      key: 'email',        width: 25 },
    { header: 'National ID OR Passport ID', key: 'uuid',         width: 25 },
    { header: 'Phone',                      key: 'phone',        width: 50 },
    { header: 'Course Name',                key: 'course_name',  width: 50 },
  ]

  for (const e of enrollments ?? []) {
    const student = e.students as any
    const course = e.courses as any
    sheet.addRow({
      student_name: e.student_name ?? student?.name ?? '',
      email:        student?.email ?? '',
      uuid:         student?.uuid ?? '',
      phone:        student?.phone ?? '',
      course_name:  course?.name ?? '',
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
