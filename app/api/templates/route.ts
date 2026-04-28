/**
 * POST /api/templates — create a new template
 * Exact mirror of TemplateController::store()
 *
 * Accepts flat form fields (same names as the blade form):
 *   template_name, template_image (File)
 *   student_content, student_color, student_font_size, student_font_family, student_x, student_y
 *   course_content,  course_color,  course_font_size,  course_font_family,  course_x,  course_y
 *   date_content,    date_color,    date_font_size,    date_x, date_y
 *   qr_content, qr_x, qr_y, qr_code
 *   width, height  (canvas dimensions — used to calculate % positions)
 *   countText, countSignature
 *   text{i}_content, text{i}_color, text{i}_font_size, text{i}_font_family, text{i}_x, text{i}_y
 *   signature{i}_content (File), signature{i}_x, signature{i}_y
 *
 * Builds the same options JSON as the original PHP controller.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ALLOWED_IMG_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const IMG_MAX = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()

  const f = (key: string) => (formData.get(key) as string | null) ?? ''
  const n = (key: string) => parseFloat(f(key)) || 0

  const templateName = f('template_name').trim()
  const imageFile    = formData.get('template_image') as File | null

  if (!templateName) return NextResponse.json({ error: 'Template name is required.' }, { status: 422 })
  if (!imageFile)    return NextResponse.json({ error: 'Template image is required.' }, { status: 422 })

  // Validate image
  if (imageFile.size > IMG_MAX)
    return NextResponse.json({ error: 'Template image must not exceed 10MB.' }, { status: 422 })

  const imgExt = imageFile.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_IMG_EXTS.includes(imgExt))
    return NextResponse.json({ error: 'Template image must be jpeg, png, gif, or webp.' }, { status: 422 })

  // Canvas dimensions (set by create.js immediately on load)
  const width  = n('width')  || 1024
  const height = n('height') || 768

  // Pixel positions (set by jQuery draggable stops)
  const studentX = n('student_x')
  const studentY = n('student_y')
  const courseX  = n('course_x')
  const courseY  = n('course_y')
  const dateX    = n('date_x')
  const dateY    = n('date_y')
  const qrX      = n('qr_x')
  const qrY      = n('qr_y')

  // Percent positions — mirrors Laravel: ($x / $width) * 100
  const pct = (px: number, dim: number) => dim > 0 ? (px / dim) * 100 : 0

  const serviceClient = createServiceClient()

  // Uniqueness check
  const { data: existing } = await serviceClient
    .from('templates').select('id').eq('name', templateName).maybeSingle()
  if (existing)
    return NextResponse.json({ error: `Template name "${templateName}" already exists.` }, { status: 422 })

  // Upload template image — named {template_name}.{ext} (same as original)
  const imgSafeName = `${templateName.replace(/\s+/g, '_')}.${imgExt}`
  const imgBytes = await imageFile.arrayBuffer()

  const { error: imgErr } = await serviceClient.storage
    .from('templates')
    .upload(imgSafeName, imgBytes, { contentType: imageFile.type, upsert: true })

  if (imgErr) return NextResponse.json({ error: imgErr.message }, { status: 500 })

  // Build options JSON — exact same structure as TemplateController::store()
  const options: Record<string, unknown> = {
    width,
    height,
    student: {
      content:            f('student_content'),
      color:              f('student_color'),
      font_size:          f('student_font_size'),
      font_family:        f('student_font_family'),
      text_align:         f('student_text_align') || 'center',
      position_pixel_x:   studentX,
      position_pixel_y:   studentY,
      position_percent_x: pct(studentX, width),
      position_percent_y: pct(studentY, height),
    },
    course: {
      content:            f('course_content'),
      color:              f('course_color'),
      font_size:          f('course_font_size'),
      font_family:        f('course_font_family'),
      text_align:         f('course_text_align') || 'center',
      position_pixel_x:   courseX,
      position_pixel_y:   courseY,
      position_percent_x: pct(courseX, width),
      position_percent_y: pct(courseY, height),
    },
    date: {
      content:            f('date_content'),
      color:              f('date_color'),
      font_size:          f('date_font_size'),
      text_align:         f('date_text_align') || 'center',
      position_pixel_x:   dateX,
      position_pixel_y:   dateY,
      position_percent_x: pct(dateX, width),
      position_percent_y: pct(dateY, height),
    },
    qr_code: {
      content:            f('qr_content'),
      position_pixel_x:   qrX,
      position_pixel_y:   qrY,
      position_percent_x: pct(qrX, width),
      position_percent_y: pct(qrY, height),
    },
  }

  // Texts — loop 0..countText (mirrors PHP for loop)
  const texts: unknown[] = []
  const countText = parseInt(f('countText')) || -1
  for (let i = 0; i <= countText; i++) {
    const tx = n(`text${i}_x`)
    const ty = n(`text${i}_y`)
    texts.push({
      content:            f(`text${i}_content`),
      color:              f(`text${i}_color`),
      font_family:        f(`text${i}_font_family`),
      font_size:          f(`text${i}_font_size`),
      text_align:         f(`text${i}_text_align`) || 'center',
      position_pixel_x:   tx,
      position_pixel_y:   ty,
      position_percent_x: pct(tx, width),
      position_percent_y: pct(ty, height),
    })
  }
  options.texts = texts

  // Signatures — loop 0..countSignature (mirrors PHP for loop)
  const signatures: unknown[] = []
  const countSignature = parseInt(f('countSignature')) || -1
  for (let x = 0; x <= countSignature; x++) {
    const sigFile = formData.get(`signature${x}_content`) as File | null
    if (!sigFile) continue

    const sigExt = sigFile.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_IMG_EXTS.includes(sigExt)) continue
    if (sigFile.size > 5 * 1024 * 1024) continue

    // Named {template_name}{index}.{ext} — mirrors PHP: $newFile = $template_name . $x . '.' . $exten
    const sigName = `${templateName.replace(/\s+/g, '_')}${x}.${sigExt}`
    const sigBytes = await sigFile.arrayBuffer()

    await serviceClient.storage
      .from('signatures')
      .upload(sigName, sigBytes, { contentType: sigFile.type, upsert: true })

    const sx = n(`signature${x}_x`)
    const sy = n(`signature${x}_y`)
    signatures.push({
      content:            sigName,
      position_pixel_x:   sx,
      position_pixel_y:   sy,
      position_percent_x: pct(sx, width),
      position_percent_y: pct(sy, height),
    })
  }
  options.signatures = signatures

  // Save to database
  const { data: template, error: dbErr } = await (serviceClient as any)
    .from('templates')
    .insert({ name: templateName, image: imgSafeName, options })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ template }, { status: 201 })
}
