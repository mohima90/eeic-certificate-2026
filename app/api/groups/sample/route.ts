/**
 * GET /api/groups/sample — download sample Excel file
 * Mirrors: GroupController::export() — the "download sample" button in create modal
 */

import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET() {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Sample')

  sheet.columns = [
    { header: 'email',                      key: 'email',        width: 30 },
    { header: 'national_id_or_passport_id', key: 'uuid',         width: 25 },
    { header: 'phone',                      key: 'phone',        width: 20 },
    { header: 'student_name',               key: 'student_name', width: 25 },
    { header: 'course_name',                key: 'course_name',  width: 30 },
  ]

  // Example row
  sheet.addRow({
    email: 'student@example.com',
    uuid: '12345678901234',
    phone: '01012345678',
    student_name: 'Ahmed Mohamed',
    course_name: 'Course Name',
  })

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="sample.xlsx"',
    },
  })
}
