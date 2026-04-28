'use client'

/**
 * Re-initializes all Metronic components after every Next.js client-side navigation.
 *
 * Problem: Metronic's scripts.bundle.js runs its init() calls on DOMContentLoaded.
 * Next.js SPA navigation does not trigger DOMContentLoaded again, so drawers,
 * menus, toggles, tooltips, and scrolls are never initialized on navigated pages.
 *
 * This component sits in the admin layout and re-runs all Metronic inits
 * whenever the pathname changes.
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function MetronicInit() {
  const pathname = usePathname()

  useEffect(() => {
    const win = window as any

    function reinit() {
      try { win.KTDrawer?.init()      } catch {}
      try { win.KTMenu?.init()        } catch {}
      try { win.KTScroll?.init()      } catch {}
      try { win.KTToggle?.init()      } catch {}
      try { win.KTTooltip?.init()     } catch {}
      try { win.KTScrollTop?.init()   } catch {}
      try { win.KTComponents?.init()  } catch {}
    }

    // If Metronic globals are already loaded, init immediately
    if ((win as any).KTDrawer) {
      reinit()
      return
    }

    // Otherwise poll until scripts.bundle.js has finished loading
    const interval = setInterval(() => {
      if (win.KTDrawer) {
        clearInterval(interval)
        reinit()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [pathname]) // Re-run on every navigation

  return null
}
