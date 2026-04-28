/**
 * Excel import logic
 * Mirrors: app/Imports/GroupImport.php
 *
 * Expected columns (row 1 = headers):
 *   email | national_id_or_passport_id | phone | student_name | course_name
 *
 * Logic:
 *   - Find or create Student (match by email OR uuid OR phone)
 *   - Find or create Course (match by name)
 *   - Create Enrollment (group_id, student_id, course_id, student_name)
 *   - Skip blank rows
 */

import * as XLSX from 'xlsx'
import { createServiceClient } from '@/lib/supabase/server'

interface ExcelRow {
  email: string
  national_id_or_passport_id: string
  phone: string
  student_name: string
  course_name: string
}

export async function importGroupFromExcel(
  fileBuffer: ArrayBuffer,
  groupId: number,
  ext: string = 'xlsx'
): Promise<{ imported: number; errors: string[] }> {
  const workbook = ext === 'csv'
    ? XLSX.read(new TextDecoder('utf-8').decode(fileBuffer), { type: 'string' })
    : XLSX.read(fileBuffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '' })

  const supabase = createServiceClient()
  let imported = 0
  const errors: string[] = []

  for (const row of rows) {
    // Skip blank rows
    if (!row.email && !row.national_id_or_passport_id && !row.phone) continue

    try {
      // ── Find or create student ────────────────────────────
      let student = null
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .or(
          `email.eq.${row.email},uuid.eq.${row.national_id_or_passport_id},phone.eq.${row.phone}`
        )
        .maybeSingle()

      if (existing) {
        student = existing
      } else {
        const { data: created, error } = await supabase
          .from('students')
          .insert({
            name: row.student_name,
            email: row.email,
            uuid: row.national_id_or_passport_id,
            phone: row.phone,
          })
          .select('id')
          .single()

        if (error) {
          errors.push(`Row ${row.email}: ${error.message}`)
          continue
        }
        student = created
      }

      // ── Find or create course ─────────────────────────────
      let course = null
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('name', row.course_name)
        .maybeSingle()

      if (existingCourse) {
        course = existingCourse
      } else {
        const { data: createdCourse, error } = await supabase
          .from('courses')
          .insert({ name: row.course_name })
          .select('id')
          .single()

        if (error) {
          errors.push(`Row ${row.email}: ${error.message}`)
          continue
        }
        course = createdCourse
      }

      // ── Create enrollment ─────────────────────────────────
      const { error: enrollError } = await supabase.from('enrollments').insert({
        group_id: groupId,
        student_id: student.id,
        course_id: course.id,
        student_name: row.student_name,
      })

      if (enrollError) {
        errors.push(`Row ${row.email}: ${enrollError.message}`)
        continue
      }

      imported++
    } catch (err) {
      errors.push(`Row ${row.email}: unexpected error`)
    }
  }

  return { imported, errors }
}
