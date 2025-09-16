'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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

function NewServiceRequestForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'LOW'|'MEDIUM'|'HIGH'|'URGENT'>('MEDIUM')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploaded, setUploaded] = useState<Record<string, { url?: string; error?: string }>>({})
  const maxFiles = 5
  const maxFileSize = 10 * 1024 * 1024

  const searchParams = useSearchParams()

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await apiFetch('/api/services')
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        const mapped: Service[] = list.map((s: any) => ({ id: s.id, name: s.name }))
        setServices(mapped)
        const pre = searchParams?.get('serviceId')
        if (pre && mapped.some((s: Service) => s.id === pre)) setServiceId(pre)
      } catch {
      }
    }
    if (session) loadServices()
  }, [session, searchParams])

  const canSubmit = serviceId && title.trim().length >= 5

  const uploadFile = async (file: File): Promise<{ url?: string; error?: string }> => {
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'service-requests')
      const res = await fetch('/api/uploads', { method: 'POST', body: form })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { error: json?.error || 'Upload failed' }
      }
      return { url: json.url }
    } catch (e) {
      return { error: 'Upload failed' }
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const results = await Promise.all(files.map(async (f) => {
        const key = `${f.name}-${f.lastModified}`
        const result = await uploadFile(f)
        setUploaded(prev => ({ ...prev, [key]: result }))
        return { file: f, result }
      }))

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
          attachments
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error?.message || err?.error || 'Failed to create request')
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
                <Select onValueChange={setServiceId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
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
                    const filtered = incoming.filter(f => f.size <= maxFileSize)
                    if (filtered.length < incoming.length) {
                      toast.error('Some files exceeded 10MB and were skipped')
                    }
                    const next = [...files, ...filtered].slice(0, maxFiles)
                    if (next.length < files.length + filtered.length) {
                      toast.error(`Maximum ${maxFiles} files allowed`)
                    }
                    setFiles(next)
                  }}
                />
                {files.length > 0 && (
                  <ul className="mt-2 divide-y divide-gray-200 rounded-md border border-gray-200">
                    {files.map((f, idx) => {
                      const key = `${f.name}-${f.lastModified}`
                      const info = uploaded[key]
                      return (
                        <li key={`${f.name}-${idx}`} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="truncate">
                            {f.name} <span className="text-gray-500">({Math.round(f.size/1024)} KB)</span>
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </Button>
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

export default function NewServiceRequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 py-8" />}> 
      <NewServiceRequestForm />
    </Suspense>
  )
}
