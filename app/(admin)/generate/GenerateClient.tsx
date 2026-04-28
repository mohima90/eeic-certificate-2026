'use client'

import { useState } from 'react'
import DataTableInit from '@/components/admin/DataTableInit'
import { showToast } from '@/lib/toast'

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect opacity="0.5" x="11.364" y="20.364" width="16" height="2" rx="1" transform="rotate(-90 11.364 20.364)" fill="black" />
    <rect x="4.36396" y="11.364" width="16" height="2" rx="1" fill="black" />
  </svg>
)

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
  </svg>
)

const PdfIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
    <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z" />
    <path fillRule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103" />
  </svg>
)

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect opacity="0.5" x="6" y="17.3137" width="16" height="2" rx="1" transform="rotate(-45 6 17.3137)" fill="black" />
    <rect x="7.41422" y="6" width="16" height="2" rx="1" transform="rotate(45 7.41422 6)" fill="black" />
  </svg>
)

interface Student {
  id: number; name: string; email: string; uuid: string; phone: string
  course: string; course_id: string; template: string; template_id: string
  group: { id: number; name: string }; group_id: string; student_id: string
}

interface Props {
  students: Student[]
  groups: { id: number; name: string }[]
  templates: { id: number; name: string }[]
}

export default function GenerateClient({ students, groups, templates }: Props) {
  const [groupId,    setGroupId]    = useState('')
  const [templateId, setTemplateId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: parseInt(groupId), template_id: parseInt(templateId) }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed.')
      showToast('error', data.error ?? 'Generation failed.')
      setSubmitting(false)
      return
    }

    const { emailResult } = data
    if (emailResult?.failed > 0) {
      const msg = `Sent ${emailResult.sent}, failed ${emailResult.failed}: ${emailResult.errors.join('; ')}`
      setError(msg)
      showToast('warning', `Sent ${emailResult.sent}, failed ${emailResult.failed}`)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    showToast('success', 'Certificates generated and emails sent')
    document.getElementById('close-generate-modal')?.click()
    window.location.reload()
  }

  return (
    <div className="row gy-5 g-xl-8">
      <div className="col-xl-12">
        <div className="card card-xl-stretch mb-5 mb-xl-8">
          <div className="card-header border-0 pt-5">
            <h3 className="card-title align-items-start flex-column">
              <span className="card-label fw-bolder fs-3 mb-1">Student</span>
              <span className="text-muted mt-1 fw-bold fs-7">Over :{students.length}</span>
            </h3>
            <div className="card-toolbar" data-bs-toggle="tooltip" data-bs-placement="top"
              data-bs-trigger="hover" title="Click to add a Generate" suppressHydrationWarning>
              <a className="btn btn-sm btn-light btn-active-primary" data-bs-toggle="modal"
                data-bs-target="#kt_modal_invite_friends">
                <span className="svg-icon svg-icon-3"><PlusIcon /></span>
                New Generate
              </a>
            </div>
          </div>

          <div className="card-body py-3">
            <div className="table-responsive">
              <table
                id="generate"
                className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4"
              >
                <thead>
                  <tr className="fw-bolder text-muted">
                    <th className="w-25px">ID</th>
                    <th className="min-w-100px">Name</th>
                    <th className="min-w-150px">Email</th>
                    <th className="min-w-150px">NotionalID OR Passport</th>
                    <th className="min-w-150px">Phone</th>
                    <th className="min-w-150px">Course</th>
                    <th className="min-w-100px">Template</th>
                    <th className="min-w-100px">Group</th>
                    <th className="min-w-100px text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, i) => (
                    <tr key={i}>
                      <td>{student.id}</td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.uuid}</td>
                      <td>{student.phone}</td>
                      <td>
                        <span className="badge badge-light-danger">{student.course}</span>
                      </td>
                      <td>{student.template}</td>
                      <td>{student.group?.name}</td>
                      <td>
                        <div className="d-flex justify-content-end flex-shrink-0">
                          <a
                            href={`/generate/${student.student_id}/${student.course_id}/${student.template_id}/${student.group_id}`}
                            className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-2"
                          >
                            <span className="svg-icon svg-icon-3"><EyeIcon /></span>
                          </a>
                          <a
                            href={`/api/generate/download?student=${student.student_id}&course=${student.course_id}&template=${student.template_id}&group=${student.group_id}`}
                            className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm"
                          >
                            <PdfIcon />
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

      {/* Create Modal */}
      <div className="modal fade" id="kt_modal_invite_friends" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog mw-650px">
          <div className="modal-content">
            <div className="modal-header pb-0 border-0 justify-content-end">
              <div id="close-generate-modal" className="btn btn-sm btn-icon btn-active-color-primary" data-bs-dismiss="modal">
                <span className="svg-icon svg-icon-1"><CloseIcon /></span>
              </div>
            </div>
            <div className="modal-body scroll-y mx-5 mx-xl-18 pt-0 pb-15">
              <div className="text-center mb-13">
                <h1 className="mb-3">Create Generate</h1>
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
                <div className="row">
                  <div className="col-6">
                    <label className="required form-label">Group</label>
                    <select
                      className="form-select form-select-solid mb-8"
                      value={groupId}
                      onChange={e => setGroupId(e.target.value)}
                      required
                    >
                      <option value="">Select Group</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="required form-label">Template</label>
                    <select
                      className="form-select form-select-solid mb-8"
                      value={templateId}
                      onChange={e => setTemplateId(e.target.value)}
                      required
                    >
                      <option value="">Select Template</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-light-primary fw-bolder w-100 mb-8" disabled={submitting}>
                  {submitting ? 'Generating & Sending Emails...' : 'Generate & Send Emails'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* new DataTable('#generate') */}
      <DataTableInit tableId="generate" />
    </div>
  )
}
