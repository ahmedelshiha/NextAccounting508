"use client"

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
import { getApiErrorMessage } from '@/lib/api-error'
import { isOnline, queueServiceRequest, processQueuedServiceRequests, registerBackgroundSync } from '@/lib/offline-queue'
import { useTranslations } from '@/lib/i18n'

interface Service { id: string; name: string }

type Priority = 'LOW'|'MEDIUM'|'HIGH'|'URGENT'

export default function NewServiceRequestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useTranslations()
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  // Title will be auto-generated server-side; keep notes in `description` field
  const [description, setDescription] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Availability booking (optional)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [slotDuration, setSlotDuration] = useState<number | ''>('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slots, setSlots] = useState<{ start: string; end: string; available: boolean }[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [bookingType, setBookingType] = useState<'STANDARD'|'RECURRING'|'EMERGENCY'|'CONSULTATION'>('STANDARD')

  const [files, setFiles] = useState<File[]>([])
  const [uploaded, setUploaded] = useState<Record<string, { url?: string; error?: string }>>({})
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({})
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const [serviceQuery, setServiceQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const maxFiles = 5
  const maxFileSize = 10 * 1024 * 1024

  // Attempt processing any previously queued submissions when the page loads
  useEffect(() => {
    processQueuedServiceRequests().catch(() => {})
  }, [])

  // Debounce service search input to reduce re-renders and improve UX on large lists
  useEffect(() => {
    const tmo = setTimeout(() => setDebouncedQuery(serviceQuery.trim().toLowerCase()), 250)
    return () => clearTimeout(tmo)
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

  const { t: _t } = useTranslations()
  const hasPendingUploads = files.some((f) => {
    const key = `${f.name}-${f.lastModified}`
    const info = uploaded[key]
    return !info?.url && (uploadingKeys[key] || !info)
  })
  const canSubmit = !!serviceId && description.trim().length >= 3 && !hasPendingUploads

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
                resolve({ error: (resp as any)?.error || t('portal.upload.failed') })
              }
            } catch {
              resolve({ error: t('portal.upload.failed') })
            }
          }
        }

        xhr.onerror = () => resolve({ error: t('portal.upload.failed') })
        xhr.send(form)
      } catch {
        resolve({ error: t('portal.upload.failed') })
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

  const fetchAvailability = async () => {
    if (!serviceId || !appointmentDate) return
    setLoadingSlots(true)
    setSelectedSlot('')
    setSlots([])
    try {
      const from = new Date(appointmentDate)
      const to = new Date(appointmentDate)
      to.setHours(23,59,59,999)
      const params = new URLSearchParams()
      params.set('serviceId', serviceId)
      params.set('dateFrom', from.toISOString())
      params.set('dateTo', to.toISOString())
      if (typeof slotDuration === 'number') params.set('duration', String(slotDuration))
      const res = await apiFetch(`/api/portal/service-requests/availability?${params.toString()}`)
      const json = await res.json().catch(() => ({} as any))
      const list = Array.isArray(json?.data?.slots) ? json.data.slots : []
      setSlots(list)
    } catch {
      toast.error(t('portal.availability.loadFailed'))
    } finally {
      setLoadingSlots(false)
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

      const serviceSnapshot = selectedService ? { id: selectedService.id, name: selectedService.name } : undefined

      const payload = {
        serviceId,
        description: description || undefined,
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        ...(selectedSlot ? {
          isBooking: true,
          scheduledAt: selectedSlot,
          duration: typeof slotDuration === 'number' ? slotDuration : undefined,
          bookingType,
        } : {}),
        requirements: { serviceSnapshot },
        attachments,
      }

      // Offline-first: if offline, queue and register background sync
      if (!isOnline()) {
        await queueServiceRequest(payload)
        await registerBackgroundSync()
        toast.success(t('portal.offline.saved'))
        router.push('/portal/service-requests')
        return
      }

      const res = await apiFetch('/api/portal/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({} as any))
        toast.error(getApiErrorMessage(errBody, t('portal.serviceRequests.createFailed')))
        return
      }
      const json = await res.json()
      toast.success(t('portal.serviceRequests.created'))
      router.push(`/portal/service-requests/${json.data.id}`)
    } catch (e: any) {
      // Network error fallback: queue for later processing
      if (String(e?.name || '').includes('TypeError') || !isOnline()) {
        await queueServiceRequest({
          serviceId,
          description: description || undefined,
          priority,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
          ...(selectedSlot ? {
            isBooking: true,
            scheduledAt: selectedSlot,
            duration: typeof slotDuration === 'number' ? slotDuration : undefined,
            bookingType,
          } : {}),
          requirements: { serviceSnapshot: selectedService ? { id: selectedService.id, name: selectedService.name } : undefined },
          attachments: [],
        })
        await registerBackgroundSync()
        toast.success(t('portal.offline.saved'))
        router.push('/portal/service-requests')
      } else {
        toast.error(t('portal.serviceRequests.createFailed'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('portal.serviceRequests.new.title')}</h1>
            <p className="text-gray-600">{t('portal.serviceRequests.new.subtitle')}</p>
          </div>
          <Button variant="outline" asChild aria-label={t('common.cancel')}>
            <Link href="/portal/service-requests">{t('common.cancel')}</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('portal.serviceRequests.form.title')}</CardTitle>
            <CardDescription>{t('portal.serviceRequests.form.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>{t('portal.serviceRequests.form.service')}</Label>
                <div className="mt-1 flex flex-col gap-2">
                  <Input
                    placeholder={t('portal.serviceRequests.form.serviceSearchPlaceholder')}
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    aria-label={t('portal.serviceRequests.form.serviceSearchAria')}
                  />
                  <Select onValueChange={(v) => { setServiceId(v); const found = services.find(s => s.id === v) || null; setSelectedService(found) }} value={serviceId}>
                    <SelectTrigger aria-label={t('portal.serviceRequests.form.serviceSelectAria')}>
                      <SelectValue placeholder={t('portal.serviceRequests.form.serviceSelectPlaceholder')} />
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
                <Label htmlFor="desc">{t('portal.serviceRequests.form.notes')}</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={5} placeholder={t('portal.serviceRequests.form.notesPlaceholder')} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('portal.serviceRequests.form.priority')}</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger className="mt-1" aria-label={t('portal.serviceRequests.form.priority')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">{t('priority.low')}</SelectItem>
                      <SelectItem value="MEDIUM">{t('priority.medium')}</SelectItem>
                      <SelectItem value="HIGH">{t('priority.high')}</SelectItem>
                      <SelectItem value="URGENT">{t('priority.urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deadline">{t('portal.serviceRequests.form.deadline')}</Label>
                  <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div className="mt-2">
                <Label>{t('portal.serviceRequests.form.appointment')}</Label>
                <div className="mt-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} aria-label={t('portal.reschedule.date')} />
                  </div>
                  <div>
                    <Select value={String(slotDuration || '')} onValueChange={(v) => setSlotDuration(v ? Number(v) : '')}>
                      <SelectTrigger aria-label={t('portal.reschedule.durationPlaceholder')}>
                        <SelectValue placeholder={t('portal.reschedule.durationPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t('portal.reschedule.default')}</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                        <SelectItem value="90">90</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={bookingType} onValueChange={(v) => setBookingType(v as any)}>
                      <SelectTrigger aria-label={t('portal.serviceRequests.form.bookingType')}>
                        <SelectValue placeholder={t('portal.serviceRequests.form.bookingTypePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STANDARD">{t('portal.serviceRequests.form.bookingType.standard')}</SelectItem>
                        <SelectItem value="RECURRING">{t('portal.serviceRequests.form.bookingType.recurring')}</SelectItem>
                        <SelectItem value="EMERGENCY">{t('portal.serviceRequests.form.bookingType.emergency')}</SelectItem>
                        <SelectItem value="CONSULTATION">{t('portal.serviceRequests.form.bookingType.consultation')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center">
                    <Button type="button" variant="outline" onClick={fetchAvailability} disabled={!serviceId || !appointmentDate || loadingSlots} aria-label={t('portal.reschedule.findSlots')}>
                      {loadingSlots ? t('common.loading') : t('portal.reschedule.findSlots')}
                    </Button>
                  </div>
                </div>
                {slots.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">{t('portal.reschedule.availableTimes')}</div>
                    <div className="flex flex-wrap gap-2">
                      {slots.filter(s => s.available).map((s) => {
                        const dt = new Date(s.start)
                        const label = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        const isSel = selectedSlot === s.start
                        return (
                          <Button key={s.start} type="button" size="sm" variant={isSel ? 'default' : 'outline'} onClick={() => setSelectedSlot(s.start)} aria-label={label}>
                            {label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="attachments">{t('portal.serviceRequests.form.attachments')}</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  className="mt-1"
                  onChange={(e) => {
                    const incoming = Array.from(e.target.files || [])
                    const filtered = incoming.filter((f) => f.size <= maxFileSize)
                    if (filtered.length < incoming.length) {
                      toast.error(t('portal.serviceRequests.form.filesTooLarge'))
                    }
                    const next = [...files, ...filtered].slice(0, maxFiles)
                    if (next.length < files.length + filtered.length) {
                      toast.error(t('portal.serviceRequests.form.maxFiles', { max: maxFiles }))
                    }
                    const existingKeys = new Set(files.map((f) => `${f.name}-${f.lastModified}`))
                    const newFiles = next.filter((f) => !existingKeys.has(`${f.name}-${f.lastModified}`))
                    setFiles(next)
                    newFiles.forEach((f) => uploadSingle(f))
                  }}
                  aria-label={t('portal.serviceRequests.form.attachmentsAria')}
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
                                  <a href={info.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{t('common.view')}</a>
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
                                  aria-label={t('portal.discussion.retryUpload')}
                                >
                                  {info?.error ? t('portal.discussion.retryUpload') : t('portal.discussion.upload')}
                                </Button>
                              )}
                              {isUploading && <span className="text-gray-600">{t('portal.serviceRequests.form.uploading')}</span>}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                                aria-label={t('portal.discussion.remove')}
                              >
                                {t('portal.discussion.remove')}
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
                <p className="mt-1 text-xs text-gray-500">{t('portal.serviceRequests.form.attachmentsHelp', { max: maxFiles })}</p>
              </div>

              <div className="flex items-center justify-between">
                {hasPendingUploads && (
                  <p className="text-xs text-gray-600">{t('portal.serviceRequests.form.waitUploads')}</p>
                )}
                <div className="flex-1"></div>
                <Button onClick={handleSubmit} disabled={!canSubmit || submitting} aria-label={selectedSlot ? t('portal.serviceRequests.submitWithAppointment') : t('portal.serviceRequests.submit')}>
                  {submitting ? t('portal.serviceRequests.submitting') : hasPendingUploads ? t('portal.serviceRequests.uploading') : selectedSlot ? t('portal.serviceRequests.submitWithAppointment') : t('portal.serviceRequests.submit')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
