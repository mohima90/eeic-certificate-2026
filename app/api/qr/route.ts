/**
 * GET /api/qr?text=... — local QR code generation
 * Replaces external quickchart.io service used in original scan.blade.php
 * Returns PNG image
 */

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text')
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  const pngBuffer = await QRCode.toBuffer(decodeURIComponent(text), {
    type: 'png',
    width: 200,
    margin: 1,
  })

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
