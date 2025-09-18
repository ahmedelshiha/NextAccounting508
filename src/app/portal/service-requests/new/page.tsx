'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'

interface Service { id: string; name: string }

type Priority = 'LOW'|'MEDIUM'|'HIGH'|'URGENT'

export default function NewServiceRequestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [files, setFiles] = useState<File[]>([])
  const [uploaded, setUploaded] = useState<Record<string, { url?: string; error?: string }>>({})
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({})
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const [serviceQuery, setServiceQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const maxFiles = 5
  const maxFileSize = 10 * 1024 * 1024

  // Debounce service search input to reduce re-renders and improve UX on large lists
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(serviceQuery.trim().toLowerCase()), 250)
    return () => clearTimeout(t)
  }, [serviceQuery])

  const filteredServices = useMemo(() => {
    if (!debouncedQuery) return services
    return services.filter((s) => s.name.toLowerCase().includes(debouncedQuery))
  }, [services, debouncedQuery])

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await apiFetch('/api/services')
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        setServices(list.map((s: any) => ({ id: s.id, name: s.name })))
      } catch {
        // ignore
      }
    }
    if (session) loadServices()
  }, [session])

  const hasPendingUploads = files.some((f) => {
    const key = `${f.name}-${f.lastModified}`
    const info = uploaded[key]
    return !info?.url && (uploadingKeys[key] || !info)
  })
  const canSubmit = !!serviceId && title.trim().length >= 5 && !hasPendingUploads

  // XMLHttpRequest-based upload to surface progress events
  const uploadFile = async (file: File, key: string): Promise<{ url?: string; error?: string }> => {
    return new Promise((resolve) => {
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('folder', 'service-requests')

        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/uploads')

        xhr.upload.addEventListener('progress', (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.min(100, Math.round((evt.loaded / evt.total) * 100))
            setUploadProgress((prev) => ({ ...prev, [key]: pct }))
          }
        })

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            try {
              const ok = xhr.status >= 200 && xhr.status < 300
              const resp = (() => { try { return JSON.parse(xhr.responseText || '{}') } catch { return {} } })()
              if (ok) {
                setUploadProgress((prev) => ({ ...prev, [key]: 100 }))
                resolve({ url: (resp as any).url })
              } else {
                resolve({ error: (resp as any)?.error || 'Upload failed' })
              }
            } catch {
              resolve({ error: 'Upload failed' })
            }
          }
        }

        xhr.onerror = () => resolve({ error: 'Upload failed' })
        xhr.send(form)
      } catch {
        resolve({ error: 'Upload failed' })
      }
    })
  }

  const uploadSingle = async (file: File) => {
    const key = `${file.name}-${file.lastModified}`
    try {
      setUploadingKeys((prev) => ({ ...prev, [key]: true }))
      setUploadProgress((prev) => ({ ...prev, [key]: 0 }))
      const result = await uploadFile(file, key)
      setUploaded((prev) => ({ ...prev, [key]: result }))
      if (result.error) {
        toast.error(`${file.name}: ${result.error}`)
      }
    } finally {
      setUploadingKeys((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Ensure all files attempted; upload any pending
      const results = await Promise.all(
        files.map(async (f) => {
          const key = `${f.name}-${f.lastModified}`
          let result = uploaded[key]
          if (!result?.url && !uploadingKeys[key]) {
            result = await uploadFile(f, key)
            setUploaded((prev) => ({ ...prev, [key]: result }))
          }
          return { file: f, result }
        })
      )

      const attachments = results.map(({ file, result }) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        url: result.url,
        uploadError: result.error,
      }))

      const res = await apiFetch('/api/portal/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          title,
          description: description || undefined,
          priority,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
          attachments,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error((err as any).error || 'Failed to create request')
        return
      }
      const json = await res.json()
      toast.success('Request created')
      router.push(`/portal/service-requests/${json.data.id}`)
    } catch {
      toast.error('Failed to create request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Service Request</h1>
            <p className="text-gray-600">Provide details to help us process your request.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/portal/service-requests">Cancel</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Fill in the required fields to submit your request.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Service</Label>
                <div className="mt-1 flex flex-col gap-2">
                  <Input
                    placeholder="Search services..."
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                  />
                  <Select onValueChange={setServiceId} value={serviceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredServices.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" placeholder="Describe your request" />
              </div>

              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={5} placeholder="Add additional details" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deadline">Desired deadline</Label>
                  <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor="attachments">Attachments</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  className="mt-1"
                  onChange={(e) => {
                    const incoming = Array.from(e.target.files || [])
                    const filtered = incoming.filter((f) => f.size <= maxFileSize)
                    if (filtered.length < incoming.length) {
                      toast.error('Some files exceeded 10MB and were skipped')
                    }
                    const next = [...files, ...filtered].slice(0, maxFiles)
                    if (next.length < files.length + filtered.length) {
                      toast.error(`Maximum ${maxFiles} files allowed`)
                    }
                    // Determine which files are new
                    const existingKeys = new Set(files.map((f) => `${f.name}-${f.lastModified}`))
                    const newFiles = next.filter((f) => !existingKeys.has(`${f.name}-${f.lastModified}`))
                    setFiles(next)
                    // Auto start upload for new files
                    newFiles.forEach((f) => uploadSingle(f))
                  }}
                />
                {files.length > 0 && (
                  <ul className="mt-2 divide-y divide-gray-200 rounded-md border border-gray-200">
                    {files.map((f, idx) => {
                      const key = `${f.name}-${f.lastModified}`
                      const info = uploaded[key]
                      const isUploading = !!uploadingKeys[key]
                      const pct = typeof uploadProgress[key] === 'number' ? uploadProgress[key] : (info?.url ? 100 : 0)
                      return (
                        <li key={`${f.name}-${idx}`} className="px-3 py-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="truncate">
                              {f.name} <span className="text-gray-500">({Math.round(f.size / 1024)} KB)</span>
                              {info?.url && (
                                <>
                                  {' '}
                                  <a href={info.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">view</a>
                                </>
                              )}
                              {info?.error && (
                                <span className="ml-2 text-red-600">{info.error}</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              {!info?.url && !isUploading && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => uploadSingle(f)}
                                >
                                  {info?.error ? 'Retry Upload' : 'Upload'}
                                </Button>
                              )}
                              {isUploading && <span className="text-gray-600">Uploading...</span>}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                          {(isUploading || info?.url) && (
                            <div className="mt-2 flex items-center gap-3">
                              <progress value={pct} max={100} className="w-40 h-2"></progress>
                              <span className="text-xs text-gray-600">{pct}%</span>
                            </div>
                          )}
                        </li>
                      )})}
                  </ul>
                )}
                <p className="mt-1 text-xs text-gray-500">Up to {maxFiles} files, 10MB each.</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
