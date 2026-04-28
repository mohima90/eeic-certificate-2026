'use client'

/**
 * Template create page — jQuery-free rewrite.
 *
 * Architecture:
 *   - All field positions, styles, and content live in React state.
 *   - CertificateCanvas (mode="edit") is the single source of truth for
 *     rendering; dragging an element fires an onStop callback that updates
 *     the corresponding state slice — no hidden inputs, no DOM reads.
 *   - On submit, buildFormData() serialises state into the exact same flat
 *     FormData the /api/templates POST route has always expected.
 *
 * Visual guarantee:
 *   Editor and preview use the SAME CertificateCanvas component with the
 *   SAME textStyle() function, so pixel positions are always identical.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import CertificateCanvas from '@/components/CertificateCanvas'

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 1024
const CANVAS_H = 768
const PLACEHOLDER_IMAGE = '/assets/media/illustrations/placeholder.jpg'
const QR_CONTENT = 'https://quickchart.io/qr?text=EEIC'

// ── Types ────────────────────────────────────────────────────────────────────

interface FontMeta { id: number; name: string; path: string }

interface TextEntry {
  id:          number
  content:     string
  color:       string
  font_size:   number
  font_family: string
  text_align:  string
  x:           number
  y:           number
}

interface SigEntry {
  id:         number
  file:       File | null
  previewUrl: string  // data URL shown on canvas before upload
  x:          number
  y:          number
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TemplateCreatePage() {
  const router    = useRouter()
  const nextTxtId = useRef(0)
  const nextSigId = useRef(0)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [fonts, setFonts]           = useState<FontMeta[]>([])

  // ── Canvas / template state ───────────────────────────────────────────────
  const [templateName, setTemplateName] = useState('')
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imageUrl, setImageUrl]         = useState(PLACEHOLDER_IMAGE)

  // Fixed text fields — initial positions mirror the original CSS defaults:
  //   #student { left:0; top:0 }  #course { left:0; top:30 }  #date { left:0; top:60 }
  const [student, setStudent] = useState({
    content: '', color: '#000000', font_size: 16, font_family: '', text_align: 'center', x: 0, y: 0,
  })
  const [course, setCourse] = useState({
    content: '', color: '#000000', font_size: 16, font_family: '', text_align: 'center', x: 0, y: 30,
  })
  const [date, setDate] = useState({
    content: '', color: '#000000', font_size: 16, text_align: 'center', x: 0, y: 60,
  })

  const [qrEnabled, setQrEnabled] = useState(false)
  const [qrX, setQrX]             = useState(0)
  const [qrY, setQrY]             = useState(0)

  const [texts, setTexts] = useState<TextEntry[]>([])
  const [sigs, setSigs]   = useState<SigEntry[]>([])

  // ── Side-effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/fonts').then(r => r.json()).then(d => setFonts(d.fonts ?? []))
  }, [])

  // Reinitialise Metronic scroll for the drawer body after mount.
  useEffect(() => {
    const win = window as any
    const t = setInterval(() => {
      if (win.KTScroll) { clearInterval(t); try { win.KTScroll.init() } catch {} }
    }, 50)
    return () => clearInterval(t)
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImageUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function addText() {
    const id = nextTxtId.current++
    setTexts(prev => [
      ...prev,
      { id, content: '', color: '#000000', font_size: 16, font_family: '', text_align: 'center', x: 0, y: 0 },
    ])
  }

  function removeText(id: number) {
    setTexts(prev => prev.filter(t => t.id !== id))
  }

  function updateText(id: number, patch: Partial<Omit<TextEntry, 'id'>>) {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  function addSig() {
    const id = nextSigId.current++
    setSigs(prev => [...prev, { id, file: null, previewUrl: '', x: 0, y: 0 }])
  }

  function removeSig(id: number) {
    setSigs(prev => prev.filter(s => s.id !== id))
  }

  function handleSigFileChange(id: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setSigs(prev => prev.map(s =>
        s.id === id ? { ...s, file, previewUrl: ev.target?.result as string } : s
      ))
    }
    reader.readAsDataURL(file)
  }

  // ── Form submission ───────────────────────────────────────────────────────

  function buildFormData(): FormData {
    const fd = new FormData()

    fd.set('template_name', templateName)
    if (imageFile) fd.set('template_image', imageFile)
    fd.set('width',  String(CANVAS_W))
    fd.set('height', String(CANVAS_H))

    // Student
    fd.set('student_content',     student.content)
    fd.set('student_color',       student.color)
    fd.set('student_font_size',   String(student.font_size))
    fd.set('student_font_family', student.font_family)
    fd.set('student_text_align',  student.text_align)
    fd.set('student_x',           String(Math.round(student.x)))
    fd.set('student_y',           String(Math.round(student.y)))

    // Course
    fd.set('course_content',     course.content)
    fd.set('course_color',       course.color)
    fd.set('course_font_size',   String(course.font_size))
    fd.set('course_font_family', course.font_family)
    fd.set('course_text_align',  course.text_align)
    fd.set('course_x',           String(Math.round(course.x)))
    fd.set('course_y',           String(Math.round(course.y)))

    // Date (no font_family — matches original form and API)
    fd.set('date_content',    date.content)
    fd.set('date_color',      date.color)
    fd.set('date_font_size',  String(date.font_size))
    fd.set('date_text_align', date.text_align)
    fd.set('date_x',          String(Math.round(date.x)))
    fd.set('date_y',          String(Math.round(date.y)))

    // QR
    if (qrEnabled) {
      fd.set('qr_code',    QR_CONTENT)
      fd.set('qr_content', QR_CONTENT)
      fd.set('qr_x',       String(Math.round(qrX)))
      fd.set('qr_y',       String(Math.round(qrY)))
    }

    // Dynamic texts — API loops 0..countText
    fd.set('countText', String(texts.length - 1))
    texts.forEach((t, i) => {
      fd.set(`text${i}_content`,     t.content)
      fd.set(`text${i}_color`,       t.color)
      fd.set(`text${i}_font_size`,   String(t.font_size))
      fd.set(`text${i}_font_family`, t.font_family)
      fd.set(`text${i}_text_align`,  t.text_align)
      fd.set(`text${i}_x`,           String(Math.round(t.x)))
      fd.set(`text${i}_y`,           String(Math.round(t.y)))
    })

    // Dynamic signatures — API loops 0..countSignature
    fd.set('countSignature', String(sigs.length - 1))
    sigs.forEach((s, i) => {
      if (s.file) fd.set(`signature${i}_content`, s.file)
      fd.set(`signature${i}_x`, String(Math.round(s.x)))
      fd.set(`signature${i}_y`, String(Math.round(s.y)))
    })

    return fd
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/templates', { method: 'POST', body: buildFormData() })
    if (res.ok) {
      router.push('/templates')
    } else {
      const data = await res.json()
      alert(data.error ?? 'Failed to create template.')
    }
  }

  // ── Derived canvas options ────────────────────────────────────────────────
  // Passed to CertificateCanvas; positions update live as the user drags or
  // changes values in the drawer — no DOM reads required.

  const canvasOptions = {
    width:  CANVAS_W,
    height: CANVAS_H,
    student: {
      content:          student.content,
      color:            student.color,
      font_size:        student.font_size,
      font_family:      student.font_family,
      text_align:       student.text_align,
      position_pixel_x: student.x,
      position_pixel_y: student.y,
    },
    course: {
      content:          course.content,
      color:            course.color,
      font_size:        course.font_size,
      font_family:      course.font_family,
      text_align:       course.text_align,
      position_pixel_x: course.x,
      position_pixel_y: course.y,
    },
    date: {
      content:          date.content,
      color:            date.color,
      font_size:        date.font_size,
      font_family:      '',
      text_align:       date.text_align,
      position_pixel_x: date.x,
      position_pixel_y: date.y,
    },
    qr_code: qrEnabled
      ? { content: QR_CONTENT, position_pixel_x: qrX, position_pixel_y: qrY }
      : undefined,
    texts: texts.map(t => ({
      content:          t.content,
      color:            t.color,
      font_size:        t.font_size,
      font_family:      t.font_family,
      text_align:       t.text_align,
      position_pixel_x: t.x,
      position_pixel_y: t.y,
    })),
    signatures: sigs.map(s => ({
      content:          s.file?.name ?? '',
      position_pixel_x: s.x,
      position_pixel_y: s.y,
    })),
  }

  // ── Shared UI helpers ─────────────────────────────────────────────────────

  const fontOptions = fonts.map(f => (
    <option key={f.id} value={f.name}>{f.name}</option>
  ))

  // Alignment toggle — three buttons: Start | Center | End
  // Stores 'left' | 'center' | 'right' in state and DB.
  const AlignButtons = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="btn-group w-100">
      {([['left', 'Start'], ['center', 'Center'], ['right', 'End']] as const).map(([val, label]) => (
        <button
          key={val}
          type="button"
          className={`btn btn-sm ${value === val ? 'btn-primary' : 'btn-light-primary'}`}
          onClick={() => onChange(val)}
        >
          {label}
        </button>
      ))}
    </div>
  )

  const CloseSVG = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect opacity="0.5" x="6" y="17.3137" width="16" height="2" rx="1"
        transform="rotate(-45 6 17.3137)" fill="black" />
      <rect x="7.41422" y="6" width="16" height="2" rx="1"
        transform="rotate(45 7.41422 6)" fill="black" />
    </svg>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit}>
      <button className="btn btn-light-primary mb-10" type="submit">Save</button>

      {/* ── Canvas area ─────────────────────────────────────────────────── */}
      <div className="row gy-5 g-xl-8">
        <div className="col-xl-8">
          <div className="card card-xl-stretch mb-5 mb-xl-8">
            {/*
              CertificateCanvas is the ONLY renderer.
              mode="edit"  → elements are draggable, positions update state on drag-stop.
              The canvas is a direct child of card so no card-body padding shifts positions.
            */}
            <CertificateCanvas
              mode="edit"
              imageUrl={imageUrl}
              options={canvasOptions as any}
              signatureUrls={sigs.map(s => s.previewUrl)}
              qrSrc={qrEnabled ? '/api/qr?text=EEIC' : undefined}
              onFieldDrag={(field, x, y) => {
                if (field === 'student')  setStudent(p => ({ ...p, x, y }))
                if (field === 'course')   setCourse(p  => ({ ...p, x, y }))
                if (field === 'date')     setDate(p    => ({ ...p, x, y }))
                if (field === 'qr_code') { setQrX(x); setQrY(y) }
              }}
              onTextDrag={(i, x, y) => {
                setTexts(prev => prev.map((t, idx) => idx === i ? { ...t, x, y } : t))
              }}
              onSignatureDrag={(i, x, y) => {
                setSigs(prev => prev.map((s, idx) => idx === i ? { ...s, x, y } : s))
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Drawer toggle ───────────────────────────────────────────────── */}
      <button
        type="button"
        title="Options"
        className="explore-toggle btn btn-sm bg-body btn-color-gray-700 btn-active-primary shadow-sm position-fixed px-5 fw-bolder zindex-2 top-50 mt-10 end-0 transform-90 fs-6 rounded-top-0"
        onClick={() => setDrawerOpen(true)}
      >
        <span id="kt_explore_toggle_label">Options</span>
      </button>

      {/* ── Options drawer ──────────────────────────────────────────────── */}
      <div
        id="kt_explore"
        className={`bg-body drawer drawer-end${drawerOpen ? ' drawer-on' : ''}`}
        style={{ width: 400 }}
      >
        <div className="card shadow-none rounded-0 w-100">

          {/* Header */}
          <div className="card-header" id="kt_explore_header">
            <h3 className="card-title fw-bolder text-gray-700">Options</h3>
            <div className="card-toolbar">
              <button
                type="button"
                className="btn btn-sm btn-icon btn-active-light-primary me-n5"
                onClick={() => setDrawerOpen(false)}
              >
                <span className="svg-icon svg-icon-2"><CloseSVG /></span>
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="card-body" id="kt_explore_body">
            <div
              id="kt_explore_scroll"
              className="scroll-y me-n5 pe-5"
              data-kt-scroll="true"
              data-kt-scroll-height="auto"
              data-kt-scroll-wrappers="#kt_explore_body"
              data-kt-scroll-dependencies="#kt_explore_header"
              data-kt-scroll-offset="5px"
            >
              <div className="mb-0">

                {/* ── Template Name ──────────────────────────────────── */}
                <div className="rounded border border-dashed border-gray-300 py-4 px-6 mb-5">
                  <label className="required form-label">Template Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Your Template Name"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                  />
                </div>

                {/* ── Certificate Image ──────────────────────────────── */}
                <div className="rounded border border-dashed border-gray-300 py-4 px-6 mb-5">
                  <label className="required form-label">Certificate Template</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>

                {/* ── QR Code ────────────────────────────────────────── */}
                <div className="rounded border border-dashed border-gray-300 py-4 px-6 mb-5">
                  <label className="required form-label">Qr Code</label>
                  <button
                    type="button"
                    className="btn btn-light-primary w-100"
                    disabled={qrEnabled}
                    onClick={() => setQrEnabled(true)}
                  >
                    {qrEnabled ? 'Added' : 'Add'}
                  </button>
                </div>

                {/* ── Text button (+ dynamic text panels below) ──────── */}
                <div className="rounded border border-dashed border-gray-300 py-4 px-6 mb-5">
                  <label className="required form-label">Text</label>
                  <button type="button" className="btn btn-light-primary w-100" onClick={addText}>
                    Add
                  </button>
                </div>

                {texts.map((t, i) => (
                  <div
                    key={t.id}
                    className="rounded border border-dashed border-gray-300 py-4 px-6 mb-5"
                  >
                    <h3 className="fw-bolder text-center mb-6" style={{ color: '#C70815' }}>Text</h3>
                    <button
                      type="button"
                      className="btn btn-sm btn-icon btn-active-light-primary me-n5"
                      onClick={() => removeText(t.id)}
                    >
                      <span className="svg-icon svg-icon-2"><CloseSVG /></span>
                    </button>
                    <div className="row g-5">
                      <div className="col-6">
                        <label className="required form-label">Content</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Your Content"
                          value={t.content}
                          onChange={e => updateText(t.id, { content: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="required form-label">Color</label>
                        <input
                          type="color"
                          className="form-control"
                          value={t.color}
                          onChange={e => updateText(t.id, { color: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label">Font Size</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Enter Your Font Size"
                          value={t.font_size}
                          onChange={e => updateText(t.id, { font_size: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label">Font Family</label>
                        <select
                          className="form-select form-select-solid"
                          value={t.font_family}
                          onChange={e => updateText(t.id, { font_family: e.target.value })}
                        >
                          <option disabled value="">Select Font</option>
                          {fontOptions}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Text Align</label>
                        <AlignButtons
                          value={t.text_align}
                          onChange={v => updateText(t.id, { text_align: v })}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* ── Signature button (+ dynamic sig panels below) ───── */}
                <div className="rounded border border-dashed border-gray-300 py-4 px-6 mb-5">
                  <label className="required form-label">Signature</label>
                  <button type="button" className="btn btn-light-primary w-100" onClick={addSig}>
                    Add
                  </button>
                </div>

                {sigs.map((s, i) => (
                  <div
                    key={s.id}
                    className="rounded border border-dashed border-gray-300 py-4 px-6 mb-5"
                  >
                    <h3 className="fw-bolder text-center mb-6" style={{ color: '#C70815' }}>Signature</h3>
                    <button
                      type="button"
                      className="btn btn-sm btn-icon btn-active-light-primary me-n5"
                      onClick={() => removeSig(s.id)}
                    >
                      <span className="svg-icon svg-icon-2"><CloseSVG /></span>
                    </button>
                    <div className="row g-5">
                      <div className="col-12">
                        <label className="required form-label">Signature</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={e => handleSigFileChange(s.id, e)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* ── Student ────────────────────────────────────────── */}
                <div className="rounded border border-dashed border-gray-300 py-4 px-6 mb-5">
                  <h3 className="fw-bolder text-center mb-6" style={{ color: '#C70815' }}>Student</h3>
                  <div className="row g-5">
                    <div className="col-6">
                      <label className="required form-label">Content</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Your Content"
                        value={student.content}
                        onChange={e => setStudent(p => ({ ...p, content: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="required form-label">Color</label>
                      <input
                        type="color"
                        className="form-control"
                        value={student.color}
                        onChange={e => setStudent(p => ({ ...p, color: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Font Size</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter Your Font Size"
                        value={student.font_size}
                        onChange={e => setStudent(p => ({ ...p, font_size: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Font Family</label>
                      <select
                        className="form-select form-select-solid"
                        value={student.font_family}
                        onChange={e => setStudent(p => ({ ...p, font_family: e.target.value }))}
                      >
                        <option disabled value="">Select Font</option>
                        {fontOptions}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Text Align</label>
                      <AlignButtons
                        value={student.text_align}
                        onChange={v => setStudent(p => ({ ...p, text_align: v }))}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Course ─────────────────────────────────────────── */}
                <div className="rounded border border-dashed border-gray-300 py-4 px-6 mb-5">
                  <h3 className="fw-bolder text-center mb-6" style={{ color: '#C70815' }}>Course</h3>
                  <div className="row g-5">
                    <div className="col-6">
                      <label className="required form-label">Content</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Your Content"
                        value={course.content}
                        onChange={e => setCourse(p => ({ ...p, content: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="required form-label">Color</label>
                      <input
                        type="color"
                        className="form-control"
                        value={course.color}
                        onChange={e => setCourse(p => ({ ...p, color: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Font Size</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter Your Font Size"
                        value={course.font_size}
                        onChange={e => setCourse(p => ({ ...p, font_size: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Font Family</label>
                      <select
                        className="form-select form-select-solid"
                        value={course.font_family}
                        onChange={e => setCourse(p => ({ ...p, font_family: e.target.value }))}
                      >
                        <option disabled value="">Select Font</option>
                        {fontOptions}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Text Align</label>
                      <AlignButtons
                        value={course.text_align}
                        onChange={v => setCourse(p => ({ ...p, text_align: v }))}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Date ───────────────────────────────────────────── */}
                <div className="rounded border border-dashed border-gray-300 py-4 px-6 mb-5">
                  <h3 className="fw-bolder text-center mb-6" style={{ color: '#C70815' }}>Date</h3>
                  <div className="row g-5">
                    <div className="col-6">
                      <label className="required form-label">Content</label>
                      <input
                        type="date"
                        className="form-control"
                        value={date.content}
                        onChange={e => setDate(p => ({ ...p, content: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="required form-label">Color</label>
                      <input
                        type="color"
                        className="form-control"
                        value={date.color}
                        onChange={e => setDate(p => ({ ...p, color: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Font Size</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter Your Font Size"
                        value={date.font_size}
                        onChange={e => setDate(p => ({ ...p, font_size: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Text Align</label>
                      <AlignButtons
                        value={date.text_align}
                        onChange={v => setDate(p => ({ ...p, text_align: v }))}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End options drawer */}

    </form>
  )
}
