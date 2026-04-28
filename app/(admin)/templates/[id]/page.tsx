/**
 * Template show/preview page
 * Mirrors: TemplateController::show() + resources/views/admin/template/show.blade.php
 */

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { TemplateOptions } from '@/types/database'
import CertificateCanvas from '@/components/CertificateCanvas'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TemplateShowPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const templateRes = await supabase
    .from('templates')
    .select('*')
    .eq('id', parseInt(id))
    .single()
  const template = templateRes.data as any

  if (!template) notFound()

  const options = template.options as TemplateOptions

  const { data: imgUrlData } = supabase.storage
    .from('templates')
    .getPublicUrl(template.image)

  // Pre-compute signature public URLs (server side)
  const signatureUrls = (options.signatures ?? []).map((sig: any) => {
    const { data } = supabase.storage.from('signatures').getPublicUrl(sig.content)
    return data.publicUrl
  })

  return (
    <>
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Template: {template.name}
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <Link href="/templates" className="text-muted text-hover-primary">Templates</Link>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Preview</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header border-0 pt-5">
          <h3 className="card-title">
            <span className="card-label fw-bold fs-3">Preview</span>
          </h3>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          <CertificateCanvas
            mode="preview"
            imageUrl={imgUrlData.publicUrl}
            options={options as any}
            signatureUrls={signatureUrls}
            showPlaceholders
          />
        </div>
      </div>
    </>
  )
}
