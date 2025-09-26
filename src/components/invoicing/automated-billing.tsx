"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'
import { toast } from 'sonner'

const cadences = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
]

type Cadence = 'weekly' | 'monthly' | 'quarterly'

function nextRuns(start: string, cadence: Cadence, count = 3): string[] {
  const base = new Date(start + 'T00:00:00Z')
  const dates: string[] = []
  const d = new Date(base)
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      if (cadence === 'weekly') d.setUTCDate(d.getUTCDate() + 7)
      if (cadence === 'monthly') d.setUTCMonth(d.getUTCMonth() + 1)
      if (cadence === 'quarterly') d.setUTCMonth(d.getUTCMonth() + 3)
    }
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

export default function AutomatedBillingSequences() {
  const [name, setName] = useState('Monthly Retainer')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [cadence, setCadence] = useState<Cadence>('monthly')
  const [amount, setAmount] = useState(500)
  const [currency, setCurrency] = useState('USD')
  const [saving, setSaving] = useState(false)

  const preview = useMemo(() => nextRuns(startDate, cadence, 3), [startDate, cadence])

  const canSave = name.trim().length > 0 && amount >= 0 && /^[A-Z]{3}$/.test(currency)

  const onSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/invoicing/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startDate, cadence, amount, currency }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to save sequence')
      }
      const json = await res.json().catch(() => ({}))
      trackEvent('billing_sequence_created', { id: json?.data?.id, cadence, amount, currency })
      toast.success('Sequence created')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save sequence')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automated Billing Sequences</CardTitle>
          <CardDescription>Create a recurring invoice schedule with predictable cadence.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seq-name">Sequence Name</Label>
              <Input id="seq-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="start">Start Date</Label>
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cadence">Cadence</Label>
              <select id="cadence" className="border border-gray-300 rounded px-2 py-2 w-full" value={cadence} onChange={(e) => setCadence(e.target.value as Cadence)}>
                {cadences.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="mt-6">
            <Label>Next runs</Label>
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {preview.map((d) => (
                <li key={d}>{d} — {currency} {amount.toFixed(2)}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex gap-2">
            <Button onClick={onSave} disabled={!canSave || saving} aria-label="Save billing sequence">{saving ? 'Saving...' : 'Save Sequence'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
