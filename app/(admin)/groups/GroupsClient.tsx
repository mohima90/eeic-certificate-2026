'use client'

/**
 * Exact match: resources/views/admin/group/index.blade.php
 *              + admin/group/create.blade.php
 *              + admin/group/edit.blade.php
 *
 * Edit is a modal on the same page (not a separate route), exactly as in original.
 */

import { useState } from 'react'
import type { Group } from '@/types/database'
import { showToast, showConfirm } from '@/lib/toast'

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect opacity="0.5" x="11.364" y="20.364" width="16" height="2" rx="1" transform="rotate(-90 11.364 20.364)" fill="black" />
    <rect x="4.36396" y="11.364" width="16" height="2" rx="1" fill="black" />
  </svg>
)

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path opacity="0.3" d="M21.4 8.35303L19.241 10.511L13.485 4.755L15.643 2.59595C16.0248 2.21423 16.5426 1.99988 17.0825 1.99988C17.6224 1.99988 18.1402 2.21423 18.522 2.59595L21.4 5.474C21.7817 5.85581 21.9962 6.37355 21.9962 6.91345C21.9962 7.45335 21.7817 7.97122 21.4 8.35303ZM3.68699 21.932L9.88699 19.865L4.13099 14.109L2.06399 20.309C1.98815 20.5354 1.97703 20.7787 2.03189 21.0111C2.08674 21.2436 2.2054 21.4561 2.37449 21.6248C2.54359 21.7934 2.75641 21.9115 2.989 21.9658C3.22158 22.0201 3.4647 22.0084 3.69099 21.932H3.68699Z" fill="black" />
    <path d="M5.574 21.3L3.692 21.928C3.46591 22.0032 3.22334 22.0141 2.99144 21.9594C2.75954 21.9046 2.54744 21.7864 2.3789 21.6179C2.21036 21.4495 2.09202 21.2375 2.03711 21.0056C1.9822 20.7737 1.99289 20.5312 2.06799 20.3051L2.696 18.422L5.574 21.3ZM4.13499 14.105L9.891 19.861L19.245 10.507L13.489 4.75098L4.13499 14.105Z" fill="black" />
  </svg>
)

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
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

export default function GroupsClient({ groups: initialGroups }: { groups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups)

  // Create form state
  const [createName, setCreateName] = useState('')
  const [createFile, setCreateFile] = useState<File | null>(null)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit form state (modal on same page — matches original)
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [editing, setEditing] = useState(false)

  function openEdit(group: Group) {
    setEditGroup(group)
    setEditName(group.name)
    setEditError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createFile) return
    setCreating(true)
    setCreateError('')

    const form = new FormData()
    form.append('name', createName)
    form.append('file', createFile)

    const res = await fetch('/api/groups', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setCreateError(data.error ?? 'Failed to create group.')
      showToast('error', data.error ?? 'Failed to create group.')
      setCreating(false)
      return
    }

    setGroups(prev => [data.group, ...prev])
    setCreateName('')
    setCreateFile(null)
    setCreating(false)
    document.getElementById('close-create-modal')?.click()
    showToast('success', 'Group created successfully')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editGroup) return
    setEditing(true)
    setEditError('')

    const res = await fetch(`/api/groups/${editGroup.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    const data = await res.json()

    if (!res.ok) {
      setEditError(data.error ?? 'Failed to update group.')
      showToast('error', data.error ?? 'Failed to update group.')
      setEditing(false)
      return
    }

    setGroups(prev => prev.map(g => g.id === editGroup.id ? { ...g, name: editName } : g))
    setEditing(false)
    document.getElementById('close-edit-modal')?.click()
    showToast('success', 'Group updated successfully')
  }

  async function handleDelete(id: number) {
    const confirmed = await showConfirm('Delete Group?', 'This group will be permanently removed.')
    if (!confirmed) return
    const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setGroups(prev => prev.filter(g => g.id !== id))
      showToast('success', 'Group deleted successfully')
    } else {
      showToast('error', 'Failed to delete group')
    }
  }

  return (
    <div className="row gy-5 g-xl-8">
      <div className="col-xl-12">
        <div className="card card-xl-stretch mb-5 mb-xl-8">
          <div className="card-header border-0 pt-5">
            <h3 className="card-title align-items-start flex-column">
              <span className="card-label fw-bolder fs-3 mb-1">Group</span>
              <span className="text-muted mt-1 fw-bold fs-7">Over {groups.length}</span>
            </h3>
            <div className="card-toolbar" data-bs-toggle="tooltip" data-bs-placement="top"
              data-bs-trigger="hover" title="Click to add a Group" suppressHydrationWarning>
              <a className="btn btn-sm btn-light btn-active-primary" data-bs-toggle="modal"
                data-bs-target="#kt_modal_invite_friends">
                <span className="svg-icon svg-icon-3"><PlusIcon /></span>
                New Group
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
                  {groups.map(group => (
                    <tr key={group.id}>
                      <td>{group.id}</td>
                      <td>
                        <div className="d-flex justify-content-start flex-row">
                          <span className="text-dark fw-bolder text-hover-primary d-block mb-1 fs-6">
                            {group.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex justify-content-end flex-shrink-0">
                          {/* Edit — opens #edit_group modal, exactly as original */}
                          <a
                            href="#"
                            className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#edit_group"
                            onClick={e => { e.preventDefault(); openEdit(group) }}
                          >
                            <span className="svg-icon svg-icon-3"><PencilIcon /></span>
                          </a>
                          {/* Show */}
                          <a
                            href={`/groups/${group.id}`}
                            className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                          >
                            <span className="svg-icon svg-icon-3"><EyeIcon /></span>
                          </a>
                          {/* Delete */}
                          <a
                            href="#"
                            className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm"
                            onClick={e => { e.preventDefault(); handleDelete(group.id) }}
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

      {/* Create Group Modal — admin/group/create.blade.php */}
      <div className="modal fade" id="kt_modal_invite_friends" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog mw-650px">
          <div className="modal-content">
            <div className="modal-header pb-0 border-0 justify-content-end">
              <div id="close-create-modal" className="btn btn-sm btn-icon btn-active-color-primary" data-bs-dismiss="modal">
                <span className="svg-icon svg-icon-1"><CloseIcon /></span>
              </div>
            </div>
            <div className="modal-body scroll-y mx-5 mx-xl-18 pt-0 pb-15">
              <div className="text-center mb-13">
                <h1 className="mb-3">Create Group</h1>
              </div>
              <div className="separator d-flex flex-center mb-8">
                <span className="text-uppercase bg-body fs-7 fw-bold text-muted px-3"></span>
              </div>
              <form onSubmit={handleCreate}>
                <div className="row">
                  <div className="col-6">
                    <label className="required form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control form-control-solid mb-8"
                      placeholder="Enter Group Name"
                      value={createName}
                      onChange={e => setCreateName(e.target.value)}
                      required
                    />
                    {createError && (
                      <div className="alert alert-dismissible bg-light-danger border border-danger border-dashed d-flex flex-column flex-sm-row w-100 p-5 mb-5 mt-5">
                        <div className="d-flex flex-column pe-0 pe-sm-10"><span>{createError}</span></div>
                      </div>
                    )}
                  </div>
                  <div className="col-6">
                    <label className="required form-label">File</label>
                    <input
                      type="file"
                      name="file"
                      className="form-control form-control-solid mb-8"
                      accept=".xlsx,.csv"
                      onChange={e => setCreateFile(e.target.files?.[0] ?? null)}
                      required
                    />
                  </div>
                </div>
                <a href="/api/groups/sample" className="btn btn-light-primary fw-bolder w-100 mb-8">
                  download sample
                </a>
                <button type="submit" className="btn btn-light-primary fw-bolder w-100 mb-8" disabled={creating}>
                  {creating ? 'Saving...' : 'Save'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Group Modal — admin/group/edit.blade.php */}
      <div className="modal fade" id="edit_group" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog mw-650px">
          <div className="modal-content">
            <div className="modal-header pb-0 border-0 justify-content-end">
              <div id="close-edit-modal" className="btn btn-sm btn-icon btn-active-color-primary" data-bs-dismiss="modal">
                <span className="svg-icon svg-icon-1"><CloseIcon /></span>
              </div>
            </div>
            <div className="modal-body scroll-y mx-5 mx-xl-18 pt-0 pb-15">
              <div className="text-center mb-13">
                <h1 className="mb-3">Rename Group</h1>
              </div>
              <div className="separator d-flex flex-center mb-8">
                <span className="text-uppercase bg-body fs-7 fw-bold text-muted px-3"></span>
              </div>
              <form onSubmit={handleEdit}>
                <div className="row">
                  <div className="col-12">
                    <label className="required form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control form-control-solid mb-8"
                      placeholder="Enter Group Name"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      required
                    />
                    {editError && (
                      <div className="alert alert-dismissible bg-light-danger border border-danger border-dashed d-flex flex-column flex-sm-row w-100 p-5 mb-5 mt-5">
                        <div className="d-flex flex-column pe-0 pe-sm-10"><span>{editError}</span></div>
                      </div>
                    )}
                  </div>
                </div>
                <button type="submit" className="btn btn-light-primary fw-bolder w-100 mb-8" disabled={editing}>
                  {editing ? 'Updating...' : 'Update'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
