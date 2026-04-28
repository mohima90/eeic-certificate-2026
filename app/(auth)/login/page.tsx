'use client'

/**
 * Login page — exact HTML from resources/views/auth/login.blade.php
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('These credentials do not match our records.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="d-flex flex-column flex-root">
      <div className="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center bgi-no-repeat bgi-size-contain bgi-attachment-fixed">
        <div className="d-flex flex-center flex-column flex-column-fluid p-10 pb-lg-20">
          {/* Logo */}
          <div className="mb-12">
            <img alt="Logo" src="/assets/media/logos/logo.png" className="h-40px" />
          </div>

          {/* Form card */}
          <div className="w-lg-500px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto">
            <form className="form w-100" onSubmit={handleSubmit} noValidate id="kt_sign_in_form">
              <div className="text-center mb-10">
                <h1 className="text-dark mb-3">Sign In to EEIC</h1>
              </div>

              {error && (
                <div className="mb-lg-15 alert alert-danger">
                  <div className="alert-text font-weight-bold">{error}</div>
                </div>
              )}

              <div className="fv-row mb-10">
                <label className="form-label fs-6 fw-bolder text-dark" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="form-control form-control-lg form-control-solid"
                  type="email"
                  name="email"
                  autoComplete="username"
                  autoFocus
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="fv-row mb-10">
                <div className="d-flex flex-stack mb-2">
                  <label className="form-label fw-bolder text-dark fs-6 mb-0" htmlFor="password">Password</label>
                </div>
                <input
                  id="password"
                  className="form-control form-control-lg form-control-solid"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  id="kt_sign_in_submit"
                  className="btn btn-lg btn-primary w-100 mb-5"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="indicator-progress" style={{ display: 'block' }}>
                      Please wait...
                      <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
                    </span>
                  ) : (
                    <span className="indicator-label">Login</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
