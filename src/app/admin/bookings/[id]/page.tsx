'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Users,
  DollarSign,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Save,
} from 'lucide-react'
import { formatCurrencyFromDecimal, type DecimalLike } from '@/lib/decimal-utils'

interface ServiceLite {
  id: string
  name: string
  price?: DecimalLike
  duration?: number | null
  category?: string | null
}

interface ClientLite {
  id?: string
  name?: string | null
  email: string
  phone?: string | null
}

interface BookingDetail {
  id: string
  clientId?: string
  serviceId?: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  scheduledAt: string
  duration: number
  notes?: string | null
  adminNotes?: string | null
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  confirmed?: boolean
  reminderSent?: boolean
  createdAt?: string
  updatedAt?: string
  assignedTeamMember?: { id: string; name: string; email: string }
  service: ServiceLite
  client: ClientLite
}

interface TeamMemberLite { id: string; name: string; email: string }

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<'CONFIRMED'|'COMPLETED'|'CANCELLED'|null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMemberLite[]>([])
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await apiFetch(`/api/bookings/${id}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body?.error || `Failed to load (${res.status})`)
          setBooking(null)
          return
        }
        const data = await res.json()
        if (!ignore) {
          setBooking(data)
          setAdminNotes(data?.adminNotes || '')
        }
      } catch {
        if (!ignore) setError('Could not fetch booking')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [id])

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  })

  const statusBadge = useMemo(() => {
    switch (booking?.status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'NO_SHOW': return 'bg-gray-100 text-gray-800'
      case 'PENDING':
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }, [booking?.status])

  async function updateStatus(next: 'CONFIRMED'|'COMPLETED'|'CANCELLED') {
    if (!booking) return
    setUpdatingStatus(next)
    try {
      const res = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, confirmed: next === 'CONFIRMED' ? true : undefined })
      })
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body?.error || `Failed to update (${res.status})`)
      }
    } catch {
      setError('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  async function saveNotes() {
    if (!booking) return
    setSavingNotes(true)
    try {
      const res = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes })
      })
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body?.error || `Failed to save notes (${res.status})`)
      }
    } catch {
      setError('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
          <div className="bg-white border rounded-lg h-48" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/bookings"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unable to load booking</CardTitle>
              <CardDescription className="text-red-600">{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Ensure this booking exists and you have permission to view it.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/bookings"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600">ID: {booking.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {booking.status !== 'CONFIRMED' && booking.status !== 'CANCELLED' && (
              <Button onClick={() => updateStatus('CONFIRMED')} disabled={!!updatingStatus}>
                <CheckCircle className="h-4 w-4 mr-2" />Confirm
              </Button>
            )}
            {booking.status === 'CONFIRMED' && (
              <Button variant="outline" onClick={() => updateStatus('COMPLETED')} disabled={!!updatingStatus}>
                <CheckCircle className="h-4 w-4 mr-2" />Mark Complete
              </Button>
            )}
            {booking.status !== 'CANCELLED' && (
              <Button variant="ghost" onClick={() => updateStatus('CANCELLED')} disabled={!!updatingStatus}>
                <XCircle className="h-4 w-4 mr-2" />Cancel
              </Button>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between w-full">
              <div>
                <CardTitle className="text-lg">{booking.service?.name}</CardTitle>
                <CardDescription>
                  {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge className={statusBadge}>{booking.status}</Badge>
                <div className="text-sm text-gray-500 mt-2">{booking.duration} min</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {booking.service?.price != null && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatCurrencyFromDecimal(booking.service.price)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{formatDate(booking.scheduledAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{formatTime(booking.scheduledAt)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-1">Client</div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gray-500" />{booking.clientName || booking.client?.name || 'N/A'}</div>
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-500" />{booking.clientEmail}</div>
                    {booking.clientPhone && (
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" />{booking.clientPhone}</div>
                    )}
                  </div>
                </div>

                {booking.notes && (
                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-1">Client Notes</div>
                    <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">{booking.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Notes</CardTitle>
            <CardDescription>Internal only</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add internal notes" />
              <div className="flex items-center gap-2">
                <Button onClick={saveNotes} disabled={savingNotes}>
                  <Save className="h-4 w-4 mr-2" />Save Notes
                </Button>
                {updatingStatus && <span className="text-xs text-gray-500">Updating status…</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
