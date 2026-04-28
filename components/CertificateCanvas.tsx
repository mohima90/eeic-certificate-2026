'use client'

/**
 * CertificateCanvas — single rendering engine for both editor and preview.
 *
 * mode="edit"    → all elements are draggable; drag-stop fires callbacks to
 *                  update parent state; shows content typed so far.
 * mode="preview" → elements are static; shows real student/course data or
 *                  Arabic placeholders (showPlaceholders=true).
 *
 * Both modes produce IDENTICAL pixel layout:
 *   - Fixed canvas: width × height px (default 1024 × 768)
 *   - background-size: 100% 100%
 *   - Text: position:absolute left:Xpx top:Ypx, no %, em, rem, flex, transform
 *   - line-height:1  white-space:nowrap  direction:ltr  text-align:left
 *   - Same @font-face fonts loaded globally by the admin layout
 */

import DraggableField from './DraggableField'

export type CertificateMode = 'edit' | 'preview'

// Internal types — more permissive than TemplateTextField so any DB object fits
interface TextField {
  content?:          string
  color?:            string
  font_size?:        number | string
  font_family?:      string
  text_align?:       string   // 'left' | 'center' | 'right'
  position_pixel_x:  number
  position_pixel_y:  number
}

interface Options {
  width?:     number
  height?:    number
  student?:   TextField
  course?:    TextField
  date?:      TextField & { content?: string }
  qr_code?:   { content?: string; position_pixel_x: number; position_pixel_y: number }
  texts?:     TextField[]
  signatures?: { content: string; position_pixel_x: number; position_pixel_y: number }[]
}

interface Props {
  mode?:              CertificateMode
  imageUrl:           string
  options:            Options
  // Edit-mode callbacks — called after each drag-stop with the new pixel position
  onFieldDrag?:       (field: 'student' | 'course' | 'date' | 'qr_code', x: number, y: number) => void
  onTextDrag?:        (index: number, x: number, y: number) => void
  onSignatureDrag?:   (index: number, x: number, y: number) => void
  // Preview-mode content
  studentName?:       string
  courseName?:        string
  qrSrc?:             string
  signatureUrls?:     string[]
  showPlaceholders?:  boolean
}

/**
 * Returns the CSS style object for a text element.
 * Values are pixel-locked — no relative units — so editor == preview.
 *
 * text_align drives a translateX transform so the stored (x, y) position is
 * the LEFT edge for 'left', the CENTER for 'center', or the RIGHT edge for
 * 'right'.  display:inline-block is required for transform to apply on the
 * span element.
 */
function textStyle(field: TextField): React.CSSProperties {
  const align      = field.text_align ?? 'left'
  const translateX = align === 'center' ? '-50%'
                   : align === 'right'  ? '-100%'
                   : '0%'

  return {
    display:       'inline-block',
    color:         field.color       || '#000000',
    fontSize:      `${field.font_size ?? 16}px`,
    fontFamily:    field.font_family || 'inherit',
    fontWeight:    'normal',
    fontStyle:     'normal',
    lineHeight:    1,
    letterSpacing: 'normal',
    whiteSpace:    'nowrap',
    direction:     'ltr',
    margin:        0,
    padding:       0,
    transform:     `translateX(${translateX})`,
  }
}

export default function CertificateCanvas({
  mode             = 'preview',
  imageUrl,
  options,
  onFieldDrag,
  onTextDrag,
  onSignatureDrag,
  studentName,
  courseName,
  qrSrc,
  signatureUrls    = [],
  showPlaceholders = false,
}: Props) {
  const isEdit  = mode === 'edit'
  const canvasW = options.width  ?? 1024
  const canvasH = options.height ?? 768

  // What text to display for the student and course slots
  const studentText = isEdit
    ? (options.student?.content ?? '')
    : showPlaceholders ? 'أحمد محمد علي'          : (studentName ?? '')

  const courseText = isEdit
    ? (options.course?.content ?? '')
    : showPlaceholders ? 'اسم البرنامج التدريبي' : (courseName ?? '')

  // Date: always rendered in edit mode (user must be able to drag it before
  // typing), only rendered in preview mode when content is non-empty.
  const showDate = isEdit || !!options.date?.content

  return (
    <div
      style={{
        position:           'relative',
        width:              canvasW,
        height:             canvasH,
        margin:             0,
        padding:            0,
        boxSizing:          'border-box',
        backgroundImage:    `url(${imageUrl})`,
        backgroundSize:     '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat:   'no-repeat',
        overflow:           'hidden',
      }}
    >

        {/* ── Student ─────────────────────────────────────── */}
        {options.student && (
          <DraggableField
            x={options.student.position_pixel_x}
            y={options.student.position_pixel_y}
            disabled={!isEdit}
            onStop={(x, y) => onFieldDrag?.('student', x, y)}
          >
            <span style={textStyle(options.student)}>{studentText}</span>
          </DraggableField>
        )}

        {/* ── Course ──────────────────────────────────────── */}
        {options.course && (
          <DraggableField
            x={options.course.position_pixel_x}
            y={options.course.position_pixel_y}
            disabled={!isEdit}
            onStop={(x, y) => onFieldDrag?.('course', x, y)}
          >
            <span style={textStyle(options.course)}>{courseText}</span>
          </DraggableField>
        )}

        {/* ── Date ────────────────────────────────────────── */}
        {options.date && showDate && (
          <DraggableField
            x={options.date.position_pixel_x}
            y={options.date.position_pixel_y}
            disabled={!isEdit}
            onStop={(x, y) => onFieldDrag?.('date', x, y)}
          >
            <span style={textStyle(options.date)}>{options.date.content ?? ''}</span>
          </DraggableField>
        )}

        {/* ── Extra text elements ──────────────────────────── */}
        {options.texts?.map((text, i) => (
          <DraggableField
            key={i}
            x={text.position_pixel_x}
            y={text.position_pixel_y}
            disabled={!isEdit}
            onStop={(x, y) => onTextDrag?.(i, x, y)}
          >
            <span style={textStyle(text)}>{text.content ?? ''}</span>
          </DraggableField>
        ))}

        {/* ── Signatures ──────────────────────────────────── */}
        {options.signatures?.map((sig, k) => {
          const url = signatureUrls[k]
          if (url) {
            return (
              <DraggableField
                key={k}
                x={sig.position_pixel_x}
                y={sig.position_pixel_y}
                disabled={!isEdit}
                onStop={(x, y) => onSignatureDrag?.(k, x, y)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  style={{ display: 'block', width: 150, height: 100 }}
                />
              </DraggableField>
            )
          }
          // In edit mode, show a placeholder box so the user can position
          // the signature before uploading the image.
          if (isEdit) {
            return (
              <DraggableField
                key={k}
                x={sig.position_pixel_x}
                y={sig.position_pixel_y}
                disabled={false}
                onStop={(x, y) => onSignatureDrag?.(k, x, y)}
              >
                <div
                  style={{
                    width:          150,
                    height:         100,
                    background:     '#f8f8f8',
                    border:         '2px dashed #ccc',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       12,
                    color:          '#aaa',
                  }}
                >
                  Signature
                </div>
              </DraggableField>
            )
          }
          return null
        })}

        {/* ── QR code ─────────────────────────────────────── */}
        {options.qr_code?.content && (
          qrSrc ? (
            <DraggableField
              x={options.qr_code.position_pixel_x}
              y={options.qr_code.position_pixel_y}
              disabled={!isEdit}
              onStop={(x, y) => onFieldDrag?.('qr_code', x, y)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="QR" style={{ display: 'block', width: 75, height: 75 }} />
            </DraggableField>
          ) : (showPlaceholders || isEdit) ? (
            <DraggableField
              x={options.qr_code.position_pixel_x}
              y={options.qr_code.position_pixel_y}
              disabled={!isEdit}
              onStop={(x, y) => onFieldDrag?.('qr_code', x, y)}
            >
              <div
                style={{
                  width:          75,
                  height:         75,
                  background:     '#f0f0f0',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       10,
                  color:          '#888',
                }}
              >
                QR
              </div>
            </DraggableField>
          ) : null
        )}

    </div>
  )
}
