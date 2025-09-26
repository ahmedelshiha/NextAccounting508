"use client"

import { useState, useMemo, useId } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle2, FileUp, ShieldAlert, UploadCloud } from 'lucide-react'

type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'quarantined' | 'rejected' | 'error'

interface UploadItem {
  id: string
  name: string
  size: number
  contentType?: string
  category: string
  status: UploadStatus
  message?: string
  url?: string
}

const CATEGORIES = [
  'Tax Documents',
  'Receipts',
  'Invoices',
  'Contracts',
  'Payroll',
] as const

export function SecureDocumentUpload() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Tax Documents')
  const [selected, setSelected] = useState<File | null>(null)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [progress, setProgress] = useState(0)
  const inputId = useId()

  const disabled = useMemo(() => !selected, [selected])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelected(file)
    setProgress(0)
  }

  const humanSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    const units = ['KB','MB','GB']
    let size = bytes
    let i = 0
    while (size >= 1024 && i < units.length) { size /= 1024; i++ }
    return `${size.toFixed(1)} ${units[i-1]}`
  }

  const sanitizeFolder = (name: string) => name.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-')

  const handleUpload = async () => {
    if (!selected) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const pending: UploadItem = {
      id,
      name: selected.name,
      size: selected.size,
      contentType: (selected as any).type,
      category,
      status: 'uploading'
    }
    setUploads(prev => [pending, ...prev])

    try {
      // Simulate progress for UX; fetch doesn't expose native upload progress
      setProgress(20)
      const form = new FormData()
      form.append('file', selected)
      form.append('folder', `portal/${sanitizeFolder(category)}`)
      const res = await fetch('/api/uploads', { method: 'POST', body: form })
      setProgress(90)
      const json = await res.json().catch(() => ({} as any))

      if (res.ok && json?.data) {
        setUploads(prev => prev.map(u => u.id === id ? {
          ...u,
          status: 'uploaded',
          url: json.data.url,
          message: 'Uploaded successfully'
        } : u))
        setProgress(100)
        setSelected(null)
        return
      }

      const status: UploadStatus = res.status === 422 ? 'rejected' : 'error'
      const message = json?.error || 'Upload failed'
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status, message } : u))
      setProgress(0)
    } catch (e) {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error', message: 'Network error' } : u))
      setProgress(0)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Secure Document Upload</CardTitle>
            <CardDescription>PDF, PNG, JPG, WEBP, or TXT up to 10MB. Antivirus scanning is applied automatically.</CardDescription>
          </div>
          <UploadCloud className="h-5 w-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-3 items-end mb-4">
          <div>
            <label htmlFor={`${inputId}-cat`} className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select id={`${inputId}-cat`} value={category} onChange={e => setCategory(e.target.value as any)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${inputId}-file`} className="block text-sm font-medium text-gray-700 mb-1">Choose file</label>
            <input id={`${inputId}-file`} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" onChange={onFileChange} className="w-full text-sm" />
          </div>
          <div className="flex gap-2">
            <Button className="w-full" onClick={handleUpload} disabled={disabled} aria-disabled={disabled}>
              <FileUp className="h-4 w-4 mr-2" /> Upload
            </Button>
          </div>
        </div>
        {progress > 0 && progress < 100 && (
          <div className="mb-4">
            <Progress value={progress} />
          </div>
        )}

        {uploads.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Recent uploads</h4>
            <ul className="space-y-2">
              {uploads.map(u => (
                <li key={u.id} className="flex items-center justify-between bg-gray-50 rounded-md p-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{u.name}</div>
                    <div className="text-xs text-gray-600 truncate">{u.category} • {humanSize(u.size)}{u.contentType ? ` • ${u.contentType}` : ''}</div>
                    {u.message && <div className="text-xs text-gray-500 truncate">{u.message}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.status === 'uploaded' && <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Uploaded" />}
                    {u.status === 'uploading' && <UploadCloud className="h-4 w-4 text-blue-600 animate-pulse" aria-label="Uploading" />}
                    {u.status === 'rejected' && <ShieldAlert className="h-4 w-4 text-red-600" aria-label="Rejected" />}
                    {u.status === 'error' && <AlertCircle className="h-4 w-4 text-amber-600" aria-label="Error" />}
                    {u.url && (
                      <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 underline">View</a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
