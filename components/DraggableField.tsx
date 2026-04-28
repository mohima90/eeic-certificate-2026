'use client'

import { useRef } from 'react'
import Draggable from 'react-draggable'
import type { DraggableData, DraggableEvent } from 'react-draggable'

interface Props {
  x: number
  y: number
  disabled?: boolean
  onStop?: (x: number, y: number) => void
  children: React.ReactNode
}

/**
 * Wraps any canvas element to make it draggable within its parent.
 *
 * Pattern: CSS left/top carry the "real" position; Draggable's transform
 * is always reset to {x:0, y:0}. On drag-stop, we add the delta to the
 * CSS position via onStop(), and React re-renders with the new left/top
 * while Draggable resets to zero — no visual jump.
 *
 * bounds="parent" constrains movement so the element stays inside the
 * 1024×768 canvas div (the nearest positioned ancestor).
 */
export default function DraggableField({ x, y, disabled = false, onStop, children }: Props) {
  const nodeRef = useRef<HTMLDivElement>(null)

  function handleStop(_: DraggableEvent, data: DraggableData) {
    onStop?.(x + data.x, y + data.y)
  }

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      bounds="parent"
      position={{ x: 0, y: 0 }}
      disabled={disabled}
      onStop={handleStop}
    >
      <div
        ref={nodeRef}
        style={{
          position:   'absolute',
          left:       x,
          top:        y,
          cursor:     disabled ? 'default' : 'move',
          userSelect: 'none',
        }}
      >
        {children}
      </div>
    </Draggable>
  )
}
