'use client'

/**
 * Injects `new DataTable('#tableId')` after mount.
 * Mirrors: @push('script') <script>new DataTable('#group');</script> @endpush
 * DataTables JS is loaded globally via layout.tsx (same CDN as original).
 */

import { useEffect } from 'react'

export default function DataTableInit({ tableId }: { tableId: string }) {
  useEffect(() => {
    // DataTables is loaded globally via scripts in layout.tsx
    const interval = setInterval(() => {
      const win = window as any
      if (win.DataTable) {
        clearInterval(interval)
        try {
          // Destroy existing instance if any, then reinit
          if (win.$.fn.dataTable.isDataTable(`#${tableId}`)) {
            win.$(`#${tableId}`).DataTable().destroy()
          }
          new win.DataTable(`#${tableId}`)
        } catch {}
      }
    }, 100)
    return () => clearInterval(interval)
  }, [tableId])

  return null
}
