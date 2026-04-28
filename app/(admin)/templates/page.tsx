/**
 * Exact match: resources/views/admin/template/index.blade.php
 */

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TemplateDeleteButton from './TemplateDeleteButton'

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
  </svg>
)

export default async function TemplatesPage() {
  const supabase = await createClient()
  const templatesRes = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })
  const templates = templatesRes.data as { id: number; name: string }[] | null

  return (
    <div className="row gy-5 g-xl-8">
      <div className="col-xl-12">
        <div className="card card-xl-stretch mb-5 mb-xl-8">
          <div className="card-header border-0 pt-5">
            <h3 className="card-title align-items-start flex-column">
              <span className="card-label fw-bolder fs-3 mb-1">Templates</span>
              <span className="text-muted mt-1 fw-bold fs-7">Over {templates?.length ?? 0}</span>
            </h3>
            <div className="card-toolbar" data-bs-toggle="tooltip" data-bs-placement="top"
              data-bs-trigger="hover" title="Click to add a Template" suppressHydrationWarning>
              <Link href="/templates/create" className="btn btn-sm btn-light btn-active-primary">
                <span className="svg-icon svg-icon-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect opacity="0.5" x="11.364" y="20.364" width="16" height="2" rx="1" transform="rotate(-90 11.364 20.364)" fill="black" />
                    <rect x="4.36396" y="11.364" width="16" height="2" rx="1" fill="black" />
                  </svg>
                </span>
                New Template
              </Link>
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
                  {templates?.map(template => (
                    <tr key={template.id}>
                      <td>{template.id}</td>
                      <td>{template.name}</td>
                      <td>
                        <div className="d-flex justify-content-end flex-shrink-0">
                          <Link
                            href={`/templates/${template.id}`}
                            className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                          >
                            <EyeIcon />
                          </Link>
                          <TemplateDeleteButton id={template.id} name={template.name} />
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
    </div>
  )
}
