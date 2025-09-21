"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'

export type RecurrencePattern = {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  interval?: number
  count?: number
  until?: string
  byWeekday?: number[]
}

export type RecurrencePreviewItem = { start: string; end: string; conflict?: boolean; reason?: string }

export type RecurrenceStepProps = {
  serviceId?: string | null
  startDateISO?: string | null // yyyy-mm-dd
  startTime?: string | null // HH:mm
  durationMinutes?: number | null
  value?: RecurrencePattern | null
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
  onChange?: (pattern: RecurrencePattern | null) => void
}

function toLocalISO(date: Date) {
  const z = new Date(date)
  const tzOffset = z.getTimezoneOffset() * 60000
  return new Date(z.getTime() - tzOffset).toISOString().slice(0, 16)
}

function combineDateTime(date: string, time: string) {
  try {
    return new Date(`${date}T${time}:00`)
  } catch {
    return null
  }
}

function generateOccurrencesLocal(start: Date, durationMinutes: number, pattern: RecurrencePattern): Date[] {
  const out: Date[] = []
  const interval = Math.max(1, pattern.interval ?? 1)
  const maxCount = pattern.count ?? 0
  const until = pattern.until ? new Date(pattern.until) : null
  let current = new Date(start)
  let occurrences = 0
  while (true) {
    if (until && current > until) break
    if (maxCount && occurrences >= maxCount) break
    if (!pattern.byWeekday || pattern.byWeekday.includes(current.getDay())) {
      out.push(new Date(current))
      occurrences++
    }
    if (pattern.frequency === 'DAILY') {
      current.setDate(current.getDate() + interval)
    } else if (pattern.frequency === 'WEEKLY') {
      current.setDate(current.getDate() + 7 * interval)
    } else {
      const m = current.getMonth()
      current.setMonth(m + interval)
    }
  }
  return out
}

export default function RecurrenceStep(props: RecurrenceStepProps) {
  const [enabled, setEnabled] = useState<boolean>(!!props.enabled)
  const [frequency, setFrequency] = useState<RecurrencePattern['frequency']>(props.value?.frequency || 'WEEKLY')
  const [interval, setInterval] = useState<number>(props.value?.interval ?? 1)
  const [endMode, setEndMode] = useState<'count' | 'until' | 'none'>(props.value?.count ? 'count' : (props.value?.until ? 'until' : 'none'))
  const [count, setCount] = useState<number>(props.value?.count ?? 4)
  const [until, setUntil] = useState<string | undefined>(props.value?.until)
  const [byWeekday, setByWeekday] = useState<number[]>(props.value?.byWeekday || [])
  const [preview, setPreview] = useState<RecurrencePreviewItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    props.onToggle?.(enabled)
  }, [enabled])

  useEffect(() => {
    if (!enabled) { props.onChange?.(null); return }
    const p: RecurrencePattern = {
      frequency,
      interval: Math.max(1, Number(interval || 1)),
      count: endMode === 'count' ? Math.max(1, Number(count || 1)) : undefined,
      until: endMode === 'until' && until ? new Date(until).toISOString() : undefined,
      byWeekday: frequency === 'WEEKLY' && byWeekday.length > 0 ? byWeekday : undefined,
    }
    props.onChange?.(p)
  }, [enabled, frequency, interval, endMode, count, until, byWeekday])

  const weekdayLabels = useMemo(() => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], [])

  async function loadPreview() {
    setLoading(true)
    setPreview([])
    try {
      if (!enabled || !props.serviceId || !props.startDateISO || !props.startTime) return
      const start = combineDateTime(props.startDateISO, props.startTime)
      if (!start) return
      const duration = Math.max(15, Number(props.durationMinutes || 60))
      const pattern: RecurrencePattern | null = {
        frequency,
        interval: Math.max(1, Number(interval || 1)),
        count: endMode === 'count' ? Math.max(1, Number(count || 1)) : undefined,
        until: endMode === 'until' && until ? new Date(until).toISOString() : undefined,
        byWeekday: frequency === 'WEEKLY' && byWeekday.length > 0 ? byWeekday : undefined,
      }

      // Try server-side preview first (conflict-aware). Fallback to local generation when unauthorized.
      try {
        const resp = await apiFetch('/api/portal/service-requests/recurring/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: props.serviceId,
            start: start.toISOString(),
            duration,
            recurringPattern: pattern,
          })
        })
        if (resp.ok) {
          const json = await resp.json()
          const list: RecurrencePreviewItem[] = Array.isArray(json?.plan)
            ? json.plan.map((p: any) => ({ start: String(p.start), end: String(p.end), conflict: !!p.conflict, reason: p.reason }))
            : []
          setPreview(list)
          return
        }
      } catch {}

      // Local preview without conflicts
      const occ = generateOccurrencesLocal(start, duration, pattern)
      const list: RecurrencePreviewItem[] = occ.map((s) => ({ start: s.toISOString(), end: new Date(s.getTime() + duration * 60000).toISOString(), conflict: false }))
      setPreview(list)
    } finally {
      setLoading(false)
    }
  }

  function toggleWeekday(idx: number) {
    setByWeekday((prev) => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  const startDateTime = useMemo(() => {
    if (!props.startDateISO || !props.startTime) return null
    const dt = combineDateTime(props.startDateISO, props.startTime)
    return dt ? toLocalISO(dt) : null
  }, [props.startDateISO, props.startTime])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurrence (optional)</CardTitle>
        <p className="text-gray-600">Schedule repeat appointments with a clear preview before creating the series.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Input id="recurrence-enabled" type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <Label htmlFor="recurrence-enabled">Repeat this appointment</Label>
          </div>

          {enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="recurrence-frequency">Frequency</Label>
                <select id="recurrence-frequency" className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 bg-white" value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div>
                <Label htmlFor="recurrence-interval">Repeat every</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input id="recurrence-interval" type="number" min={1} value={interval} onChange={(e) => setInterval(parseInt(e.target.value || '1', 10))} />
                  <span className="text-gray-600 text-sm">{frequency === 'DAILY' ? 'day(s)' : frequency === 'WEEKLY' ? 'week(s)' : 'month(s)'}</span>
                </div>
              </div>
              <div>
                <Label>Ends</Label>
                <select className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 bg-white" value={endMode} onChange={(e) => setEndMode(e.target.value as any)}>
                  <option value="none">Never</option>
                  <option value="count">After count</option>
                  <option value="until">On date</option>
                </select>
              </div>

              {endMode === 'count' && (
                <div>
                  <Label htmlFor="recurrence-count">Occurrences</Label>
                  <Input id="recurrence-count" type="number" min={1} value={count} onChange={(e) => setCount(parseInt(e.target.value || '1', 10))} />
                </div>
              )}
              {endMode === 'until' && (
                <div>
                  <Label htmlFor="recurrence-until">Until</Label>
                  <Input id="recurrence-until" type="date" value={until || ''} onChange={(e) => setUntil(e.target.value || undefined)} />
                </div>
              )}

              {frequency === 'WEEKLY' && (
                <div className="md:col-span-3">
                  <Label>Repeat on</Label>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {weekdayLabels.map((w, i) => (
                      <button key={i} type="button" onClick={() => toggleWeekday(i)} className={`px-3 py-2 rounded-md border text-sm ${byWeekday.includes(i) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700'}`}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {enabled && (
            <div className="mt-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <Label>Starts</Label>
                  <div className="text-sm text-gray-700 mt-1">{startDateTime ? new Date(startDateTime).toLocaleString() : 'Select date & time first'}</div>
                </div>
                <Button type="button" onClick={loadPreview} disabled={loading || !props.serviceId || !props.startDateISO || !props.startTime}>
                  {loading ? 'Generating preview…' : 'Preview series'}
                </Button>
              </div>
              {preview.length > 0 && (
                <div className="mt-3 border border-gray-200 rounded-md p-3 max-h-60 overflow-y-auto">
                  <div className="text-sm text-gray-600 mb-2">{preview.length} occurrence(s)</div>
                  <ul className="space-y-2">
                    {preview.map((p, idx) => (
                      <li key={`${p.start}-${idx}`} className="flex items-center justify-between text-sm">
                        <span className="text-gray-800">{new Date(p.start).toLocaleString()}</span>
                        {p.conflict ? (
                          <span className="text-red-600">Conflict{p.reason ? ` — ${p.reason}` : ''}</span>
                        ) : (
                          <span className="text-green-600">Available</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
