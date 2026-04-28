/**
 * Certificate PDF generator using puppeteer-core + system Chrome.
 *
 * Renders the same HTML/CSS as CertificateCanvas, so the PDF is pixel-perfect:
 * same text, same positions, same fonts, same Arabic rendering.
 */

import puppeteer from 'puppeteer-core'
import QRCode from 'qrcode'
import { createServiceClient } from '@/lib/supabase/server'
import type { Template, Enrollment } from '@/types/database'

const CHROME_PATH =
  process.env.CHROME_EXECUTABLE_PATH ??
  '/usr/bin/google-chrome'

interface GenerateOptions {
  enrollment: Enrollment & {
    student: { name: string; email: string; uuid: string }
    course:  { name: string }
  }
  template: Template
  scanUrl:  string
}

export async function generateCertificatePdf({
  enrollment,
  template,
  scanUrl,
}: GenerateOptions): Promise<Buffer> {
  const supabase  = createServiceClient()
  const options   = template.options as TemplateOptions

  const canvasW = options.width  ?? 1024
  const canvasH = options.height ?? 768

  // ── 1. Background image → data URL ──────────────────────────────────────
  const { data: imgBlob } = await supabase.storage.from('templates').download(template.image)
  const bgDataUrl = imgBlob ? await blobToDataUrl(imgBlob) : ''

  // ── 2. Signature images → data URLs ─────────────────────────────────────
  const sigDataUrls: string[] = []
  for (const sig of options.signatures ?? []) {
    const { data: sigBlob } = await supabase.storage.from('signatures').download(sig.content)
    sigDataUrls.push(sigBlob ? await blobToDataUrl(sigBlob) : '')
  }

  // ── 3. QR code → data URL ────────────────────────────────────────────────
  let qrDataUrl = ''
  if (options.qr_code?.content && scanUrl) {
    const qrBuf = await QRCode.toBuffer(scanUrl, { type: 'png', width: 300, margin: 1 })
    qrDataUrl = `data:image/png;base64,${qrBuf.toString('base64')}`
  }

  // ── 4. Custom fonts → @font-face blocks ──────────────────────────────────
  const { data: allFonts } = await supabase.from('fonts').select('name, path')
  const fontFaces: string[] = []
  for (const f of allFonts ?? []) {
    const { data: fontBlob } = await supabase.storage.from('fonts').download(f.path)
    if (fontBlob) {
      const dataUrl = await blobToDataUrl(fontBlob)
      fontFaces.push(
        `@font-face { font-family: '${f.name}'; src: url('${dataUrl}'); font-display: block; }`
      )
    }
  }

  // ── 5. Build HTML (mirrors CertificateCanvas.tsx exactly) ────────────────
  const html = buildHtml({
    canvasW,
    canvasH,
    bgDataUrl,
    options,
    studentName: enrollment.student_name || enrollment.student?.name || '',
    courseName:  enrollment.course?.name || '',
    qrDataUrl,
    sigDataUrls,
    fontFaces,
  })

  // ── 6. Render with puppeteer ──────────────────────────────────────────────
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
    headless: true,
  })

  try {
    const page = await browser.newPage()

    // Viewport matches the canvas so no scrollbars or clipping
    await page.setViewport({ width: canvasW, height: canvasH })
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBytes = await page.pdf({
      width:           `${canvasW}px`,
      height:          `${canvasH}px`,
      printBackground: true,
      margin:          { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return Buffer.from(pdfBytes)
  } finally {
    await browser.close()
  }
}

// ── HTML builder ──────────────────────────────────────────────────────────────

interface BuildArgs {
  canvasW:     number
  canvasH:     number
  bgDataUrl:   string
  options:     TemplateOptions
  studentName: string
  courseName:  string
  qrDataUrl:   string
  sigDataUrls: string[]
  fontFaces:   string[]
}

function buildHtml({
  canvasW, canvasH, bgDataUrl, options,
  studentName, courseName, qrDataUrl, sigDataUrls, fontFaces,
}: BuildArgs): string {
  const fields: string[] = []

  // Mirrors CertificateCanvas textStyle() + DraggableField positioning
  const textEl = (field: TemplateTextField, text: string) => {
    if (!text) return ''
    const align = field.text_align ?? 'left'
    const translateX = align === 'center' ? '-50%'
                     : align === 'right'  ? '-100%'
                     : '0%'
    return `
      <div style="
        position:    absolute;
        left:        ${field.position_pixel_x}px;
        top:         ${field.position_pixel_y}px;
      ">
        <span style="
          display:        inline-block;
          color:          ${field.color || '#000000'};
          font-size:      ${field.font_size ?? 16}px;
          font-family:    ${field.font_family ? `'${field.font_family}'` : 'inherit'};
          font-weight:    normal;
          font-style:     normal;
          line-height:    1;
          letter-spacing: normal;
          white-space:    nowrap;
          direction:      rtl;
          unicode-bidi:   embed;
          margin:         0;
          padding:        0;
          transform:      translateX(${translateX});
        ">${escHtml(text)}</span>
      </div>`
  }

  // Student
  if (options.student) fields.push(textEl(options.student, studentName))

  // Course
  if (options.course) fields.push(textEl(options.course, courseName))

  // Date
  if (options.date?.content) fields.push(textEl(options.date as TemplateTextField, options.date.content))

  // Extra texts
  for (const t of options.texts ?? []) {
    if (t.content) fields.push(textEl(t, t.content))
  }

  // Signatures
  for (let i = 0; i < (options.signatures ?? []).length; i++) {
    const sig = options.signatures![i]
    const url = sigDataUrls[i]
    if (url) {
      fields.push(`
        <div style="position:absolute; left:${sig.position_pixel_x}px; top:${sig.position_pixel_y}px;">
          <img src="${url}" style="display:block; width:150px; height:100px;" />
        </div>`)
    }
  }

  // QR code
  if (options.qr_code?.content && qrDataUrl) {
    const { position_pixel_x: qx, position_pixel_y: qy } = options.qr_code
    fields.push(`
      <div style="position:absolute; left:${qx}px; top:${qy}px;">
        <img src="${qrDataUrl}" style="display:block; width:75px; height:75px;" />
      </div>`)
  }

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  ${fontFaces.join('\n')}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${canvasW}px; height: ${canvasH}px; overflow: hidden; }
  #canvas {
    position:            relative;
    width:               ${canvasW}px;
    height:              ${canvasH}px;
    background-image:    url('${bgDataUrl}');
    background-size:     100% 100%;
    background-repeat:   no-repeat;
    background-position: center;
    overflow:            hidden;
  }
</style>
</head>
<body>
<div id="canvas">
  ${fields.join('\n')}
</div>
</body>
</html>`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  const b64 = Buffer.from(buf).toString('base64')
  const mime = blob.type || 'application/octet-stream'
  return `data:${mime};base64,${b64}`
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface TemplateTextField {
  content?:         string
  color?:           string
  font_size?:       number | string
  font_family?:     string
  text_align?:      string
  position_pixel_x: number
  position_pixel_y: number
}

interface TemplateOptions {
  width?:      number
  height?:     number
  student?:    TemplateTextField
  course?:     TemplateTextField
  date?:       Partial<TemplateTextField> & { content?: string }
  qr_code?:    { content?: string; position_pixel_x: number; position_pixel_y: number }
  texts?:      TemplateTextField[]
  signatures?: { content: string; position_pixel_x: number; position_pixel_y: number }[]
}
