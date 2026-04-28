/**
 * Exact match: resources/views/dashboard.blade.php
 */

import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userName = user?.email ?? ''

  return (
    <div className="d-flex flex-column flex-root">
      <div className="d-flex flex-column flex-column-fluid">
        <div className="d-flex flex-column flex-column-fluid text-center p-10 py-lg-15">
          <div className="mb-10 pt-lg-10">
            <img alt="Logo" src="/assets/media/logos/logo.png" className="h-40px mb-5" />
          </div>
          <div className="pt-lg-10 mb-10">
            <h1 className="fw-bolder fs-2qx text-gray-800 mb-7">
              Welcome {userName} to EEIC
            </h1>
            <div className="fw-bold fs-3 text-muted mb-15">Plan your Certificate .</div>
          </div>
          <div
            className="d-flex flex-row-auto bgi-no-repeat bgi-position-x-center bgi-size-contain bgi-position-y-bottom min-h-100px min-h-lg-350px"
            style={{ backgroundImage: 'url(/assets/media/illustrations/10.png)' }}
          />
        </div>
      </div>
    </div>
  )
}
