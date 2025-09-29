'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

interface ServiceDetail {
  id: string
  name?: string
  slug?: string
  category?: string
  price?: number | null
  status?: string
  description?: string | null
}

export default function AdminServiceDetailPage() {
  const router = useRouter()
  const params = useParams() as { id?: string }
  const id = params?.id

  const [service, setService] = useState<ServiceDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [versions, setVersions] = useState<any[] | null>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [checkingSlug, setCheckingSlug] = useState(false)

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    apiFetch(`/api/admin/services/${encodeURIComponent(id)}`).then(async (res) => {
      if (!mounted) return
      if (!res.ok) {
        toast.error('Failed to load service')
        setLoading(false)
        return
      }
      const j = await res.json().catch(() => null)
      setService(j || null)
      setLoading(false)
    }).catch((e) => { toast.error(String(e)); setLoading(false) })
    return () => { mounted = false }
  }, [id])

  const fetchVersions = async () => {
    if (!id) return
    setShowVersions((s) => !s)
    if (versions) return
    try {
      const res = await apiFetch(`/api/admin/services/${encodeURIComponent(id)}/versions`)
      if (!res.ok) { toast.error('Failed to load versions'); return }
      const j = await res.json()
      setVersions(j.versions || [])
    } catch (e) {
      toast.error('Failed to load versions')
    }
  }

  const checkSlug = async () => {
    if (!service?.slug) { toast.error('No slug to check'); return }
    setCheckingSlug(true)
    try {
      const res = await apiFetch(`/api/admin/services/slug-check/${encodeURIComponent(service.slug)}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        toast.error(j?.error || 'Slug check failed')
        return
      }
      const j = await res.json().catch(() => ({}))
      if (j?.available) toast.success('Slug is available')
      else toast.error('Slug is already in use')
    } catch (e) {
      toast.error('Slug check failed')
    } finally { setCheckingSlug(false) }
  }

  const handleClone = async () => {
    if (!id) return
    try {
      const res = await apiFetch(`/api/admin/services/${encodeURIComponent(id)}/clone`, { method: 'POST' })
      if (!res.ok) {
        const { toastFromResponse } = await import('@/lib/toast-api')
        await toastFromResponse(res, { failure: 'Clone failed' })
        return
      }
      const j = await res.json().catch(() => ({}))
      const newId = j?.id || j?.service?.id
      if (newId) {
        toast.success('Service cloned')
        router.push(`/admin/services/${newId}`)
      } else {
        toast.success('Service cloned')
        await new Promise((r) => setTimeout(r, 500))
        router.push('/admin/services')
      }
    } catch (e) {
      toast.error('Clone failed')
    }
  }

  if (!id) return <div className="p-6">Missing service id</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Service Detail</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push('/admin/services')}>Back</Button>
          <Button onClick={handleClone}>Clone</Button>
          <Button onClick={() => router.push(`/admin/services/${id}/settings`)} variant="outline">Settings</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{service?.name ?? (loading ? 'Loading...' : 'Service not found')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Slug</div>
                <div className="font-mono">{service?.slug ?? '—'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={checkSlug} disabled={!service?.slug || checkingSlug}>{checkingSlug ? 'Checking...' : 'Check Slug'}</Button>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Category</div>
              <div>{service?.category ?? '—'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Price</div>
              <div>{service?.price == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(service.price))}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div>{service?.status ?? '—'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Description</div>
              <div className="prose max-w-none">{service?.description ?? '—'}</div>
            </div>

            <div>
              <Button onClick={fetchVersions}>{showVersions ? 'Hide Versions' : 'Show Versions'}</Button>
            </div>

            {showVersions && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Version history</h3>
                {!versions ? <div className="text-sm text-gray-500">Loading...</div> : (
                  versions.length === 0 ? <div className="text-sm text-gray-500">No versions available.</div> : (
                    <ul className="space-y-2">
                      {versions.map((v:any) => (
                        <li key={v.id} className="border p-3 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{v.title || `Version ${v.version}`}</div>
                              <div className="text-xs text-gray-500">{v.createdAt ? new Date(v.createdAt).toLocaleString() : ''}</div>
                            </div>
                            <div>
                              <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(v)); toast.success('Version copied to clipboard') }}>Copy</Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
