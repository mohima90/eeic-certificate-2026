'use client'

/**
 * CertificateCanvas — pixel-perfect certificate preview
 *
 * Rendering is IDENTICAL to the template editor canvas:
 *   - Fixed pixel dimensions (options.width × options.height)
 *   - background-image: url(...); background-size: 100% 100%
 *   - Elements: position:absolute; left:Xpx; top:Ypx; font-size:Zpx; font-family:...
 *   - No %, em, rem, flex, or transform:scale
 *   - Same @font-face fonts loaded globally by the admin layout
 *
 * The outer div scrolls if the canvas is wider than the viewport.
 */

interface TextField {
  content?: string
  color?: string
  font_size?: number | string
  font_family?: string
  position_pixel_x: number
  position_pixel_y: number
}

interface Options {
  width?: number
  height?: number
  student?: TextField
  course?: TextField
  date?: TextField & { content?: string }
  qr_code?: { content?: string; position_pixel_x: number; position_pixel_y: number }
  texts?: TextField[]
  signatures?: { content: string; position_pixel_x: number; position_pixel_y: number }[]
}

interface Props {
  imageUrl: string
  options: Options
  studentName?: string
  courseName?: string
  qrSrc?: string
  signatureUrls?: string[]
  showPlaceholders?: boolean
}

// Exact same style object the template editor uses for text divs
// (mirrors create.blade.php CSS for #student, #course, etc.)
function textStyle(field: TextField): React.CSSProperties {
  return {
    position:      'absolute',
    left:          field.position_pixel_x,
    top:           field.position_pixel_y,
    color:         field.color ?? '#000000',
    fontSize:      `${field.font_size ?? 16}px`,
    fontFamily:    field.font_family ?? 'inherit',
    fontWeight:    'normal',
    fontStyle:     'normal',
    lineHeight:    'normal',
    letterSpacing: 'normal',
    whiteSpace:    'nowrap',
    textAlign:     'left',   // explicit — matches editor CSS
    direction:     'ltr',    // explicit — bidi handled per-character by browser
    margin:        0,
    padding:       0,
  }
}

export default function CertificateCanvas({
  imageUrl,
  options,
  studentName,
  courseName,
  qrSrc,
  signatureUrls = [],
  showPlaceholders = false,
}: Props) {
  const canvasW = options.width  ?? 1024
  const canvasH = options.height ?? 768

  return (
    /* Scrollable wrapper — allows the fixed canvas to overflow on small screens */
    <div style={{ overflowX: 'auto', overflowY: 'auto' }}>

      {/*
        Inner canvas — IDENTICAL structure to the editor #canvas div:
          position: relative
          width: {canvasW}px
          height: {canvasH}px
          background-image: url(...)
          background-size: 100% 100%
          overflow: hidden
          padding: 0 (overrides card-body if present)
      */}
      <div
        style={{
          position:        'relative',
          width:           canvasW,
          height:          canvasH,
          margin:          0,
          padding:         0,
          boxSizing:       'border-box',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize:  '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat:   'no-repeat',
          overflow:        'hidden',
        }}
      >
        {/* Student name
            Placeholders use Arabic sample text so character widths match
            real data — prevents visual position mismatch in template preview */}
        {options.student && (
          <div style={textStyle(options.student)}>
            {showPlaceholders ? 'أحمد محمد علي' : (studentName ?? '')}
          </div>
        )}

        {/* Course name */}
        {options.course && (
          <div style={textStyle(options.course)}>
            {showPlaceholders ? 'اسم البرنامج التدريبي' : (courseName ?? '')}
          </div>
        )}

        {/* Date — only if content is non-empty */}
        {options.date?.content && (
          <div style={textStyle(options.date)}>
            {options.date.content}
          </div>
        )}

        {/* Extra text elements */}
        {options.texts?.map((text, i) => (
          <div key={i} style={textStyle(text)}>
            {text.content ?? ''}
          </div>
        ))}

        {/* Signatures */}
        {options.signatures?.map((sig, k) =>
          signatureUrls[k] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={k}
              src={signatureUrls[k]}
              alt=""
              style={{
                position: 'absolute',
                left:     sig.position_pixel_x,
                top:      sig.position_pixel_y,
                width:    150,
                height:   100,
              }}
            />
          ) : null
        )}

        {/* QR code */}
        {options.qr_code?.content && qrSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrSrc}
            alt="QR"
            style={{
              position: 'absolute',
              left:     options.qr_code.position_pixel_x,
              top:      options.qr_code.position_pixel_y,
              width:    75,
              height:   75,
            }}
          />
        )}

        {/* QR placeholder (template preview — no student yet) */}
        {options.qr_code?.content && !qrSrc && showPlaceholders && (
          <div
            style={{
              position:   'absolute',
              left:       options.qr_code.position_pixel_x,
              top:        options.qr_code.position_pixel_y,
              width:      75,
              height:     75,
              background: '#f0f0f0',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize:   10,
              color:      '#888',
            }}
          >
            QR
          </div>
        )}
      </div>
    </div>
  )
}
