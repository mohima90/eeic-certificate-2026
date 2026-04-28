import { createClient } from '@/lib/supabase/server'
import { decode } from '@/lib/hashids'
import { notFound } from 'next/navigation'
import type { TemplateOptions } from '@/types/database'
import CertificateCanvas from '@/components/CertificateCanvas'
import ScaleToCover from '@/components/ScaleToCover'

interface Props {
  params: Promise<{ id: string; courseId: string; templateId: string }>
}

export default async function ScanPage({ params }: Props) {
  const { id, courseId, templateId } = await params

  const studentId = decode(id)
  const cId       = decode(courseId)
  const tId       = decode(templateId)
  if (!studentId || !cId || !tId) notFound()

  const supabase = await createClient()

  const [{ data: enrollment }, { data: template }, { data: fonts }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('*, students(*), courses(*)')
      .eq('student_id', studentId)
      .eq('course_id', cId)
      .maybeSingle(),
    supabase.from('templates').select('*').eq('id', tId).single(),
    supabase.from('fonts').select('name, path'),
  ])

  if (!enrollment || !template) notFound()

  const student = enrollment.students as any
  const course  = enrollment.courses  as any
  const options = template.options as TemplateOptions

  const canvasW = options.width  ?? 1024
  const canvasH = options.height ?? 768

  const { data: imgUrlData } = supabase.storage
    .from('templates')
    .getPublicUrl(template.image)

  const signatureUrls = (options.signatures ?? []).map((sig: any) => {
    const { data } = supabase.storage.from('signatures').getPublicUrl(sig.content)
    return data.publicUrl
  })

  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${id}/${courseId}/${templateId}`
  const qrSrc   = options.qr_code?.content
    ? `/api/qr?text=${encodeURIComponent(scanUrl)}`
    : undefined

  const displayName = enrollment.student_name || student?.name || ''
  const courseName  = course?.name || ''

  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: `document.body.id='kt_body';document.body.className='bg-body';`
      }} />

      {/* Same @font-face fonts the admin layout injects — keeps rendering identical */}
      {fonts && fonts.length > 0 && (
        <style dangerouslySetInnerHTML={{
          __html: fonts.map(f =>
            `@font-face { font-family: '${f.name}'; src: url('/api/fonts/file?path=${encodeURIComponent(f.path)}'); font-display: block; }`
          ).join('\n')
        }} />
      )}

      {/* ── Top bar (matches the admin navbar height/style) ── */}
      <div className="d-flex align-items-center bg-white shadow-sm px-6 py-3 mb-8"
        style={{ borderBottom: '1px solid #f1f1f4' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/media/logos/logo.png" alt="EEIC" className="h-35px me-4" />
        <div className="d-flex flex-column">
          <span className="fw-bold text-dark fs-5">EEIC</span>
          <span className="text-muted fs-8">Certificate Verification</span>
        </div>
        <div className="ms-auto">
          <span className="badge badge-light-success fs-7 fw-bold py-2 px-4">
            <i className="bi bi-patch-check-fill text-success me-1" />
            Verified
          </span>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1000 }}>

        {/* ── Page heading (same pattern as admin toolbar) ── */}
        <div className="d-flex align-items-center justify-content-between mb-6">
          <div>
            <h1 className="text-dark fw-bolder fs-2 mb-1">Certificate Verification</h1>
            <span className="text-muted fs-7">
              Scan confirmed · authentically issued by EEIC
            </span>
          </div>
        </div>

        {/* ── Student info card ── */}
        <div className="card card-flush mb-6 shadow-sm">
          <div className="card-header pt-5">
            <h3 className="card-title align-items-start flex-column">
              <span className="card-label fw-bold fs-4 text-dark mb-1">
                {displayName}
              </span>
              <span className="text-muted fw-semibold fs-7">Certificate holder</span>
            </h3>
            <div className="card-toolbar">
              <span className="badge badge-light-success">
                <i className="bi bi-shield-fill-check me-1" />
                Authentic
              </span>
            </div>
          </div>

          <div className="card-body pt-2 pb-6">
            {/* Separator row */}
            <div className="separator separator-dashed mb-6" />

            <div className="row g-4 mb-2">
              {/* Student */}
              <div className="col-sm-6 col-lg-4">
                <div className="d-flex align-items-center">
                  <div className="symbol symbol-40px me-3">
                    <span className="symbol-label bg-light-primary">
                      <i className="bi bi-person-fill fs-5 text-primary" />
                    </span>
                  </div>
                  <div>
                    <span className="text-muted fs-8 d-block fw-semibold mb-1">Student</span>
                    <span className="text-dark fw-bold fs-6"
                      style={{ direction: 'rtl', display: 'block' }}>
                      {displayName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Course */}
              <div className="col-sm-6 col-lg-4">
                <div className="d-flex align-items-center">
                  <div className="symbol symbol-40px me-3">
                    <span className="symbol-label bg-light-info">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-info" viewBox="0 0 16 16">
                        <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917l-7.5-3.5Z"/>
                        <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.5 4.176 9.032Z"/>
                      </svg>
                    </span>
                  </div>
                  <div>
                    <span className="text-muted fs-8 d-block fw-semibold mb-1">Course</span>
                    <span className="text-dark fw-bold fs-6"
                      style={{ direction: 'rtl', display: 'block' }}>
                      {courseName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date */}
              {options.date?.content && (
                <div className="col-sm-6 col-lg-4">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-40px me-3">
                      <span className="symbol-label bg-light-warning">
                        <i className="bi bi-calendar-check-fill fs-5 text-warning" />
                      </span>
                    </div>
                    <div>
                      <span className="text-muted fs-8 d-block fw-semibold mb-1">Date</span>
                      <span className="text-dark fw-bold fs-6">{options.date.content}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Certificate card ── */}
        <div className="card card-flush shadow-sm mb-6">
          <div className="card-header pt-5">
            <h3 className="card-title align-items-start flex-column">
              <span className="card-label fw-bold fs-4 text-dark">Certificate</span>
              <span className="text-muted fw-semibold fs-7 mt-1">
                Original — scanned via QR code
              </span>
            </h3>
            <div className="card-toolbar">
              <a
                href={`/api/generate/download?student=${id}&course=${courseId}&template=${templateId}`}
                className="btn btn-sm btn-primary"
              >
                <i className="bi bi-download me-2" />
                Download PDF
              </a>
            </div>
          </div>
          <div className="card-body pt-4 pb-6">
            <div className="rounded-3 overflow-hidden shadow"
              style={{ border: '1px solid #f1f1f4' }}>
              <ScaleToCover canvasW={canvasW} canvasH={canvasH}>
                <CertificateCanvas
                  mode="preview"
                  imageUrl={imgUrlData.publicUrl}
                  options={options as any}
                  studentName={displayName}
                  courseName={courseName}
                  qrSrc={qrSrc}
                  signatureUrls={signatureUrls}
                />
              </ScaleToCover>
            </div>
          </div>
        </div>

        {/* ── Notice ── */}
        <div className="notice d-flex bg-light-success rounded-3 border border-success
          border-dashed p-5 mb-10">
          <i className="bi bi-patch-check-fill fs-2tx text-success me-4" />
          <div>
            <h4 className="text-success fw-bold mb-1">This certificate is verified</h4>
            <span className="text-gray-700 fs-7">
              This certificate was issued by EEIC and is cryptographically verified.
              The QR code on the certificate links directly to this verification page.
            </span>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="footer py-4" style={{ borderTop: '1px solid #f1f1f4' }}>
        <div className="container d-flex align-items-center justify-content-center">
          <span className="text-muted fw-semibold fs-7">
            2024 © <span className="text-gray-800">EEIC</span> — Certificate Verification System
          </span>
        </div>
      </div>
    </>
  )
}
