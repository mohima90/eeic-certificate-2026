/**
 * Admin layout — mirrors admin/layout/app.blade.php exactly
 * body classes: header-fixed header-tablet-and-mobile-fixed toolbar-enabled toolbar-fixed aside-enabled aside-fixed
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminNavbar from '@/components/admin/AdminNavbar'
import MetronicInit from '@/components/admin/MetronicInit'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load fonts for @font-face injection (mirrors head.blade.php @foreach fonts)
  const { data: fonts } = await supabase
    .from('fonts')
    .select('id, name, path') as { data: { id: number; name: string; path: string }[] | null }

  return (
    <>
      {/* @font-face for uploaded fonts — mirrors head.blade.php */}
      {fonts && fonts.length > 0 && (
        <style dangerouslySetInnerHTML={{
          // font-display: block — browser hides text until font is loaded.
          // This prevents the user from positioning text in the fallback font
          // and then seeing a different-width rendering after font swap.
          __html: fonts.map(f =>
            `@font-face { font-family: '${f.name}'; src: url('/api/fonts/file?path=${encodeURIComponent(f.path)}'); font-display: block; }`
          ).join('\n')
        }} />
      )}

      {/* body classes — exact match to app.blade.php */}
      <script dangerouslySetInnerHTML={{
        __html: `document.body.id='kt_body'; document.body.className='header-fixed header-tablet-and-mobile-fixed toolbar-enabled toolbar-fixed aside-enabled aside-fixed'; document.body.style.cssText='--kt-toolbar-height:55px;--kt-toolbar-height-tablet-and-mobile:55px';`
      }} />

      {/* Re-initializes Metronic drawers/menus/toggles on every client navigation */}
      <MetronicInit />

      <div className="d-flex flex-column flex-root">
        <div className="page d-flex flex-row flex-column-fluid">
          <AdminSidebar />
          <div className="wrapper d-flex flex-column flex-row-fluid" id="kt_wrapper">
            <AdminNavbar userName={user.email ?? ''} />
            <div className="content d-flex flex-column flex-column-fluid" id="kt_content">
              <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                  {children}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="footer py-4 d-flex flex-lg-column" id="kt_footer">
              <div className="container-xxl d-flex flex-column flex-md-row align-items-center justify-content-between">
                <div className="text-dark order-2 order-md-1">
                  <span className="text-muted fw-bold me-2">2024 ©</span>
                  <span className="text-gray-800 text-hover-primary">EEIC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
