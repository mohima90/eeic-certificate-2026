/**
 * GET /api/generate/download — generate and stream a PDF certificate
 * Mirrors: GroupTemplateController::download()
 *
 * Query params (Hashids-encoded):
 *   student, course, template, group
 *
 * Stores generated PDF in Supabase Storage (attachments bucket)
 * File naming: {studentName}_{courseName}_{templateId}.pdf  (matches Laravel)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { decode } from '@/lib/hashids'
import { generateCertificatePdf } from '@/lib/pdf/generate'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const hStudent  = searchParams.get('student')  ?? ''
  const hCourse   = searchParams.get('course')   ?? ''
  const hTemplate = searchParams.get('template') ?? ''
  const hGroup    = searchParams.get('group')    ?? ''

  const studentId  = decode(hStudent)
  const courseId   = decode(hCourse)
  const templateId = decode(hTemplate)
  const groupId    = decode(hGroup)

  if (!studentId || !courseId || !templateId)
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })

  const serviceClient = createServiceClient()

  let enrollmentQuery = serviceClient
    .from('enrollments')
    .select('*, students(*), courses(*)')
    .eq('student_id', studentId)
    .eq('course_id', courseId)

  if (groupId) enrollmentQuery = enrollmentQuery.eq('group_id', groupId)

  const [
    { data: enrollment },
    { data: template },
  ] = await Promise.all([
    enrollmentQuery.maybeSingle(),
    serviceClient.from('templates').select('*').eq('id', templateId).single(),
  ])

  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  if (!template)   return NextResponse.json({ error: 'Template not found' },   { status: 404 })

  const student = enrollment.students as any
  const course  = enrollment.courses  as any

  // Scan URL — /scan/{hashedStudentId}/{hashedCourseId}/{hashedTemplateId}
  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${hStudent}/${hCourse}/${hTemplate}`

  // Generate PDF
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateCertificatePdf({
      enrollment: { ...enrollment, student, course },
      template,
      scanUrl,
    })
  } catch (err) {
    console.error('[generate/download] PDF generation failed:', err)
    return NextResponse.json({ error: 'PDF generation failed', detail: String(err) }, { status: 500 })
  }

  // File name: {studentName}_{courseName}_{template}.pdf  (mirrors Laravel naming)
  const pdfFilename = `${enrollment.student_name || student?.name}_${course?.name}_${template.name}.pdf`
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_؀-ۿ.()-]/g, '')

  // Store attachment record (fire-and-forget)
  serviceClient.from('attachments').upsert(
    {
      student_id:   student?.id,
      course_id:    course?.id,
      path:         pdfFilename,
      student_name: enrollment.student_name || student?.name,
    },
    { onConflict: 'student_id,course_id' }
  ).then(() => {}, () => {})

  // HTTP headers require ByteString (≤ U+00FF). Use an ASCII fallback for
  // filename= and RFC 5987 encoding (filename*=) for the full UTF-8 name.
  const asciiFilename  = pdfFilename.replace(/[^\x20-\x7E]/g, '_')
  const encodedFilename = encodeURIComponent(pdfFilename)

  // Stream PDF to browser
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
    },
  })
}
