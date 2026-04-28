import { createServiceClient } from '@/lib/supabase/server'
import { generateCertificatePdf } from '@/lib/pdf/generate'
import { sendCertificateEmail } from '@/lib/email/send'
import { encode } from '@/lib/hashids'

export interface SendGroupResult {
  sent: number
  failed: number
  errors: string[]
}

export async function sendGroupCertificates(
  group_id: number,
  template_id: number,
): Promise<SendGroupResult> {
  const serviceClient = createServiceClient()

  const { data: template } = await serviceClient
    .from('templates')
    .select('*')
    .eq('id', template_id)
    .single()

  if (!template) return { sent: 0, failed: 0, errors: ['Template not found'] }

  const { data: enrollments } = await serviceClient
    .from('enrollments')
    .select('*, students(*), courses(*)')
    .eq('group_id', group_id)

  if (!enrollments?.length) return { sent: 0, failed: 0, errors: [] }

  const results: SendGroupResult = { sent: 0, failed: 0, errors: [] }

  for (const enrollment of enrollments) {
    const student = enrollment.students as any
    const course  = enrollment.courses  as any

    try {
      const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${encode(student?.id ?? 0)}/${encode(course?.id ?? 0)}/${encode(template.id)}`

      const pdfBuffer = await generateCertificatePdf({
        enrollment: { ...enrollment, student, course },
        template,
        scanUrl,
      })

      const studentName = enrollment.student_name || student?.name || 'Student'
      const courseName  = course?.name ?? 'Course'
      const pdfFilename = `${studentName}_${courseName}_${template.name}.pdf`.replace(/\s+/g, '_')

      await serviceClient.storage
        .from('attachments')
        .upload(pdfFilename, pdfBuffer, { contentType: 'application/pdf', upsert: true })

      await serviceClient.from('attachments').upsert({
        student_id:   student?.id,
        course_id:    course?.id,
        path:         pdfFilename,
        student_name: studentName,
      }, { onConflict: 'student_id,course_id' })

      await sendCertificateEmail({
        studentName,
        studentEmail: student?.email ?? '',
        courseName,
        pdfBuffer,
        pdfFilename,
      })

      results.sent++
    } catch (err: any) {
      results.failed++
      results.errors.push(`${enrollment.student_name ?? student?.name}: ${err.message}`)
    }
  }

  return results
}
