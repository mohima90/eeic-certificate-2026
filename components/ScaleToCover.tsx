'use client'

import { useRef, useEffect, useState } from 'react'

interface Props {
  canvasW: number
  canvasH: number
  children: React.ReactNode
}

/**
 * Scales children (a fixed canvasW × canvasH element) to fill the container
 * width on any screen size, preserving aspect ratio.
 */
export default function ScaleToCover({ canvasW, canvasH, children }: Props) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function calc() {
      if (!wrapRef.current) return
      const w = wrapRef.current.offsetWidth
      setScale(Math.min(1, w / canvasW))
    }
    calc()
    const ro = new ResizeObserver(calc)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [canvasW])

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      {/* Height placeholder keeps the layout from collapsing */}
      <div style={{ height: canvasH * scale, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          transformOrigin: 'top left',
          transform:       `scale(${scale})`,
          width:           canvasW,
          height:          canvasH,
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}
