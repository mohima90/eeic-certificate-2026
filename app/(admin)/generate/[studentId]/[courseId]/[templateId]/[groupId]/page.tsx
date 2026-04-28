/**
 * Certificate preview page
 * Mirrors: GroupTemplateController::show() + resources/views/admin/generate/show.blade.php
 */

import { createClient } from '@/lib/supabase/server'
import { decode } from '@/lib/hashids'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { TemplateOptions } from '@/types/database'
import CertificateCanvas from '@/components/CertificateCanvas'

interface Props {
  params: Promise<{
    studentId: string
    courseId: string
    templateId: string
    groupId: string
  }>
}

export default async function CertificatePreviewPage({ params }: Props) {
  const { studentId, courseId, templateId, groupId } = await params

  const sId = decode(studentId)
  const cId = decode(courseId)
  const tId = decode(templateId)
  if (!sId || !cId || !tId) notFound()

  const supabase = await createClient()

  const [enrollmentRes, templateRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('*, students(*), courses(*)')
      .eq('student_id', sId)
      .eq('course_id', cId)
      .maybeSingle(),
    supabase.from('templates').select('*').eq('id', tId).single(),
  ])

  const enrollment = enrollmentRes.data as any
  const template   = templateRes.data   as any

  if (!enrollment || !template) notFound()

  const student = enrollment.students
  const course  = enrollment.courses
  const options = template.options as TemplateOptions

  const { data: imgUrlData } = supabase.storage
    .from('templates')
    .getPublicUrl(template.image)

  // Pre-compute signature public URLs (server side)
  const signatureUrls = (options.signatures ?? []).map((sig: any) => {
    const { data } = supabase.storage.from('signatures').getPublicUrl(sig.content)
    return data.publicUrl
  })

  // QR URL — local /api/qr endpoint, no external service
  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${studentId}/${courseId}/${templateId}`
  const qrSrc = options.qr_code?.content
    ? `/api/qr?text=${encodeURIComponent(scanUrl)}`
    : undefined

  const downloadUrl = `/api/generate/download?student=${studentId}&course=${courseId}&template=${templateId}&group=${groupId}`
  const displayName = enrollment.student_name || (student as any)?.name

  return (
    <>
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Certificate Preview
            </h1>
          </div>
          <div className="d-flex align-items-center gap-2 gap-lg-3">
            <a href={downloadUrl} className="btn btn-sm fw-bold btn-primary">
              Download PDF
            </a>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {/* Student info bar */}
          <div className="d-flex gap-10 mb-8">
            <div>
              <span className="text-muted fs-7 d-block">Student</span>
              <span className="fw-bold fs-5">{displayName}</span>
            </div>
            <div>
              <span className="text-muted fs-7 d-block">Course</span>
              <span className="fw-bold fs-5">{(course as any)?.name}</span>
            </div>
            <div>
              <span className="text-muted fs-7 d-block">Template</span>
              <span className="fw-bold fs-5">{template.name}</span>
            </div>
          </div>

          {/* Pixel-perfect certificate canvas — scroll wrapper keeps layout intact on small screens */}
          <div style={{ overflowX: 'auto' }}>
          <CertificateCanvas
            mode="preview"
            imageUrl={imgUrlData.publicUrl}
            options={options as any}
            studentName={displayName}
            courseName={(course as any)?.name}
            qrSrc={qrSrc}
            signatureUrls={signatureUrls}
          />
          </div>
        </div>
      </div>
    </>
  )
}
