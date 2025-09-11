'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Booking {
  id: string
  scheduledAt: string
  duration: number | null
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes: string | null
  adminNotes?: string | null
  confirmed?: boolean | null
  service?: { name: string | null }
  client?: { name: string | null, email: string | null }
}

export default function AdminBookingEditPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)

  const [status, setStatus] = useState<Booking['status']>('PENDING')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const res = await apiFetch(`/api/bookings/${id}`)
        if (res.ok) {
          const b: Booking = await res.json()
          setBooking(b)
          setStatus(b.status)
          const d = new Date(b.scheduledAt)
          const yyyy = String(d.getFullYear())
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          setDate(`${yyyy}-${mm}-${dd}`)
          const hh = String(d.getHours()).padStart(2, '0')
          const mi = String(d.getMinutes()).padStart(2, '0')
          setTime(`${hh}:${mi}`)
          setNotes(b.notes ?? '')
          setAdminNotes(b.adminNotes ?? '')
          setConfirmed(Boolean(b.confirmed))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const scheduledAtISO = useMemo(() => {
    if (!date || !time) return null
    const iso = new Date(`${date}T${time}:00`).toISOString()
    return iso
  }, [date, time])

  async function save() {
    if (!id) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        status,
        notes,
        adminNotes,
        confirmed,
      }
      if (scheduledAtISO) body.scheduledAt = scheduledAtISO

      const res = await apiFetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        router.push(`/admin/bookings/${id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-7 w-64 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-gray-600">Booking not found.</p>
          <Button asChild>
            <Link href="/admin/bookings">Back to Bookings</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Booking</h1>
            <p className="text-gray-600">Update appointment details.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/bookings/${id}`}>View Details</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/admin/bookings">Back to Bookings</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
            <CardDescription>Service: {booking.service?.name ?? 'Service'} — Client: {booking.client?.name ?? booking.client?.email ?? 'Client'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as Booking['status'])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="NO_SHOW">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Calendar className="h-3 w-3 text-gray-400" />Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Clock className="h-3 w-3 text-gray-400" />Time</label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Notes</label>
                <textarea className="w-full border rounded p-2 text-sm" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                <textarea className="w-full border rounded p-2 text-sm" rows={4} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input id="confirmed" type="checkbox" className="rounded" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <label htmlFor="confirmed" className="text-sm text-gray-700">Confirmed</label>
              {confirmed ? (
                <Badge variant="outline" className="ml-2 text-green-700 border-green-300 bg-green-50">Confirmed</Badge>
              ) : (
                <Badge variant="outline" className="ml-2 text-gray-700">Unconfirmed</Badge>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href={`/admin/bookings/${id}`}>Cancel</Link>
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
