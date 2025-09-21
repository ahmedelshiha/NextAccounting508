"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'

type Slot = {
  id: string
  serviceId: string
  teamMemberId?: string | null
  date: string
  startTime: string
  endTime: string
  available: boolean
  reason?: string | null
  maxBookings?: number
  currentBookings?: number
}

export default function AvailabilitySlotsManager() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ serviceId: '', teamMemberId: '', date: '', startTime: '', endTime: '', available: 'true', reason: '', maxBookings: '1' })

  async function load() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/availability-slots')
      if (res.ok) {
        const json = await res.json().catch(() => null)
        setSlots(json?.availabilitySlots || [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createSlot() {
    try {
      const body = {
        serviceId: form.serviceId,
        teamMemberId: form.teamMemberId || undefined,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        available: form.available === 'true',
        reason: form.reason || undefined,
        maxBookings: form.maxBookings ? Number(form.maxBookings) : undefined,
      }
      const res = await apiFetch('/api/admin/availability-slots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        await load()
        setForm({ serviceId: '', teamMemberId: '', date: '', startTime: '', endTime: '', available: 'true', reason: '', maxBookings: '1' })
      } else {
        const err = await res.json().catch(() => null)
        alert('Failed to create: ' + (err?.error || JSON.stringify(err)))
      }
    } catch (e) { alert('Failed to create') }
  }

  async function remove(id: string) {
    if (!confirm('Delete slot?')) return
    try {
      const res = await apiFetch(`/api/admin/availability-slots?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) await load()
    } catch {}
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Availability Slots</CardTitle>
          <p className="text-gray-600">Create manual overrides, blackouts, or capacity-limited slots.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Service ID</Label>
              <Input value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} />
            </div>
            <div>
              <Label>Team Member ID (optional)</Label>
              <Input value={form.teamMemberId} onChange={(e) => setForm({ ...form, teamMemberId: e.target.value })} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div>
              <Label>Available</Label>
              <select className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 bg-white" value={form.available} onChange={(e) => setForm({ ...form, available: e.target.value })}>
                <option value="true">Available</option>
                <option value="false">Blocked</option>
              </select>
            </div>
            <div>
              <Label>Max Bookings</Label>
              <Input type="number" min={0} value={form.maxBookings} onChange={(e) => setForm({ ...form, maxBookings: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>Reason</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setForm({ serviceId: '', teamMemberId: '', date: '', startTime: '', endTime: '', available: 'true', reason: '', maxBookings: '1' })}>Reset</Button>
            <Button onClick={createSlot}>Create Slot</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Existing Slots</h3>
        {loading ? <div>Loading…</div> : (
          <div className="space-y-2">
            {slots.map(s => (
              <div key={s.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{s.serviceId} {s.teamMemberId ? `— ${s.teamMemberId}` : ''}</div>
                  <div className="text-xs text-gray-600">{new Date(s.date).toISOString().slice(0,10)} {s.startTime}–{s.endTime} • {s.available ? 'Available' : 'Blocked'}</div>
                  {s.reason && <div className="text-xs text-gray-500">{s.reason}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="destructive" onClick={() => remove(s.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
