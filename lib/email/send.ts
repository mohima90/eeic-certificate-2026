import { isArabic } from '@/lib/language-detector'

interface SendCertificateEmailOptions {
  studentName: string
  studentEmail: string
  courseName: string
  pdfBuffer: Buffer
  pdfFilename: string
}

export async function sendCertificateEmail(opts: SendCertificateEmailOptions) {
  const arabic = isArabic(opts.courseName)

  const subject = arabic
    ? 'شهادة إتمام البرنامج التدريبي'
    : 'Certificate of Completion of the Training Program'

  const html = arabic
    ? buildArabicHtml(opts.studentName, opts.courseName)
    : buildEnglishHtml(opts.studentName, opts.courseName)

  const domain   = process.env.MAILGUN_DOMAIN!
  const secret   = process.env.MAILGUN_SECRET!
  const endpoint = process.env.MAILGUN_ENDPOINT ?? 'api.mailgun.net'
  const from     = `"${process.env.MAIL_FROM_NAME ?? 'EEIC'}" <${process.env.MAIL_FROM_ADDRESS ?? 'noreply@eeic.gov.eg'}>`

  const form = new FormData()
  form.append('from',    from)
  form.append('to',      opts.studentEmail)
  form.append('subject', subject)
  form.append('html',    html)
  form.append(
    'attachment',
    new Blob([new Uint8Array(opts.pdfBuffer)], { type: 'application/pdf' }),
    opts.pdfFilename,
  )

  const res = await fetch(`https://${endpoint}/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${secret}`).toString('base64')}`,
    },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Mailgun error ${res.status}: ${text}`)
  }
}

// ── Arabic email template ─────────────────────────────────────
function buildArabicHtml(studentName: string, courseName: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; direction: rtl; text-align: right; background:#f5f5f5; margin:0; padding:0; }
    .container { max-width:600px; margin:30px auto; background:#fff; border-radius:8px; overflow:hidden; }
    .header { background:#1a1a2e; padding:24px; text-align:center; }
    .body { padding:32px; color:#333; line-height:1.8; direction:rtl; text-align:right; }
    .footer { background:#f0f0f0; padding:16px; text-align:center; font-size:12px; color:#888; }
    a { color:#1a1a2e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="color:#fff;margin:0;">EEIC</h2>
    </div>
    <div class="body" dir="rtl" style="direction:rtl;text-align:right;">
      <h1>الأستاذ/ة ${escapeHtml(studentName)}</h1>
      <p>
        يسعدنا إبلاغكم بأنكم أتممتم بنجاح برنامج
        <strong>${escapeHtml(courseName)}</strong>
        .
      </p>
      <p>نتمنى لكم التوفيق والنجاح في مسيرتكم المهنية.</p>
      <p>مرفق بهذه الرسالة شهادة إتمام البرنامج التدريبي.</p>
    </div>
    <div class="footer">
      Egypt Entrepreneurship and Innovation Center (EEIC)
    </div>
  </div>
</body>
</html>`
}

// ── English email template ────────────────────────────────────
function buildEnglishHtml(studentName: string, courseName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:0; }
    .container { max-width:600px; margin:30px auto; background:#fff; border-radius:8px; overflow:hidden; }
    .header { background:#1a1a2e; padding:24px; text-align:center; }
    .body { padding:32px; color:#333; line-height:1.8; }
    .footer { background:#f0f0f0; padding:16px; text-align:center; font-size:12px; color:#888; }
    a { color:#1a1a2e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="color:#fff;margin:0;">EEIC</h2>
    </div>
    <div class="body">
      <h1>Dear ${escapeHtml(studentName)},</h1>
      <p>
        We are pleased to inform you that you have successfully completed the
        <strong>${escapeHtml(courseName)}</strong> training program.
      </p>
      <p>Please find your certificate of completion attached to this email.</p>
      <p>We wish you all the best in your professional journey.</p>
    </div>
    <div class="footer">
      Egypt Entrepreneurship and Innovation Center (EEIC)
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
