'use client'

/**
 * Exact match: resources/views/admin/font/index.blade.php
 *              + resources/views/admin/font/create.blade.php
 */

import { useState } from 'react'
import type { Font } from '@/types/database'
import { showToast, showConfirm } from '@/lib/toast'

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect opacity="0.5" x="11.364" y="20.364" width="16" height="2" rx="1" transform="rotate(-90 11.364 20.364)" fill="black" />
    <rect x="4.36396" y="11.364" width="16" height="2" rx="1" fill="black" />
  </svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5 9C5 8.44772 5.44772 8 6 8H18C18.5523 8 19 8.44772 19 9V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V9Z" fill="black" />
    <path opacity="0.5" d="M5 5C5 4.44772 5.44772 4 6 4H18C18.5523 4 19 4.44772 19 5V5C19 5.55228 18.5523 6 18 6H6C5.44772 6 5 5.55228 5 5V5Z" fill="black" />
    <path opacity="0.5" d="M9 4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V4H9V4Z" fill="black" />
  </svg>
)

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect opacity="0.5" x="6" y="17.3137" width="16" height="2" rx="1" transform="rotate(-45 6 17.3137)" fill="black" />
    <rect x="7.41422" y="6" width="16" height="2" rx="1" transform="rotate(45 7.41422 6)" fill="black" />
  </svg>
)

export default function FontsClient({ fonts: initialFonts }: { fonts: Font[] }) {
  const [fonts, setFonts] = useState(initialFonts)
  const [fontFile, setFontFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!fontFile) return
    setSubmitting(true)
    setError('')

    const form = new FormData()
    // Use original filename as font name (mirrors FontController behavior)
    form.append('font_name', fontFile.name.replace(/\.[^.]+$/, ''))
    form.append('font_file', fontFile)

    const res = await fetch('/api/fonts', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to upload font.')
      showToast('error', data.error ?? 'Failed to upload font.')
      setSubmitting(false)
      return
    }

    setFonts(prev => [data.font, ...prev])
    setFontFile(null)
    setSubmitting(false)
    // Close modal via Bootstrap
    ;(document.querySelector('[data-bs-dismiss="modal"]') as HTMLElement)?.click()
    showToast('success', 'Font uploaded successfully')
  }

  async function handleDelete(id: number) {
    const confirmed = await showConfirm('Delete Font?', 'This font will be permanently removed.')
    if (!confirmed) return
    const res = await fetch(`/api/fonts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setFonts(prev => prev.filter(f => f.id !== id))
      showToast('success', 'Font deleted successfully')
    } else {
      showToast('error', 'Failed to delete font')
    }
  }

  return (
    <div className="row gy-5 g-xl-8">
      <div className="col-xl-12">
        <div className="card card-xl-stretch mb-5 mb-xl-8">
          <div className="card-header border-0 pt-5">
            <h3 className="card-title align-items-start flex-column">
              <span className="card-label fw-bolder fs-3 mb-1">Fonts</span>
              <span className="text-muted mt-1 fw-bold fs-7">Over {fonts.length}</span>
            </h3>
            <div className="card-toolbar" data-bs-toggle="tooltip" data-bs-placement="top"
              data-bs-trigger="hover" title="Click to add a Font" suppressHydrationWarning>
              <a className="btn btn-sm btn-light btn-active-primary" data-bs-toggle="modal"
                data-bs-target="#kt_modal_invite_friends">
                <span className="svg-icon svg-icon-3"><PlusIcon /></span>
                New Font
              </a>
            </div>
          </div>

          <div className="card-body py-3">
            <div className="table-responsive">
              <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                <thead>
                  <tr className="fw-bolder text-muted">
                    <th className="w-25px">ID</th>
                    <th className="min-w-150px">Name</th>
                    <th className="min-w-100px text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fonts.map(font => (
                    <tr key={font.id}>
                      <td>{font.id}</td>
                      <td>{font.name}</td>
                      <td>
                        <div className="d-flex justify-content-end flex-shrink-0">
                          <a
                            href="#"
                            className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm"
                            onClick={e => { e.preventDefault(); handleDelete(font.id) }}
                          >
                            <span className="svg-icon svg-icon-3"><TrashIcon /></span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Font Modal — exact match to admin/font/create.blade.php */}
      <div className="modal fade" id="kt_modal_invite_friends" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog mw-650px">
          <div className="modal-content">
            <div className="modal-header pb-0 border-0 justify-content-end">
              <div className="btn btn-sm btn-icon btn-active-color-primary" data-bs-dismiss="modal">
                <span className="svg-icon svg-icon-1"><CloseIcon /></span>
              </div>
            </div>
            <div className="modal-body scroll-y mx-5 mx-xl-18 pt-0 pb-15">
              <div className="text-center mb-13">
                <h1 className="mb-3">Create Font</h1>
              </div>
              <div className="separator d-flex flex-center mb-8">
                <span className="text-uppercase bg-body fs-7 fw-bold text-muted px-3"></span>
              </div>
              {error && (
                <div className="alert alert-dismissible bg-light-danger border border-danger border-dashed d-flex flex-column flex-sm-row w-100 p-5 mb-5">
                  <div className="d-flex flex-column pe-0 pe-sm-10"><span>{error}</span></div>
                </div>
              )}
              <form onSubmit={handleCreate}>
                <label className="required form-label">Font File</label>
                <input
                  type="file"
                  name="font_file"
                  className="form-control form-control-solid mb-8"
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={e => setFontFile(e.target.files?.[0] ?? null)}
                  required
                />
                <button type="submit" className="btn btn-light-primary fw-bolder w-100 mb-8" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
