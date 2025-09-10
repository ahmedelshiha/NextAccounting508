'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, Eye } from 'lucide-react'
import { formatCurrencyFromDecimal } from '@/lib/decimal-utils'

interface Booking {
  id: string
  scheduledAt: string
  status: string
  service: { name: string; price?: number }
  duration: number
  notes?: string
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

export default function PortalBookingsPage() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/bookings', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        setBookings(Array.isArray(json) ? json : [])
      } catch (e) {
        console.error('Failed to load bookings', e)
      } finally {
        setLoading(false)
      }
    }

    if (session) load()
  }, [session])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Appointments</h1>
            <p className="text-gray-600">All bookings associated with your account.</p>
          </div>
          <div>
            <Button variant="outline" asChild>
              <Link href="/portal">Back to Portal</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-600 mb-4">You have no bookings at the moment.</p>
              <Button asChild>
                <Link href="/booking">Book Appointment</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <Card key={b.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <CardTitle className="text-lg">{b.service.name}</CardTitle>
                      <CardDescription>
                        {formatDate(b.scheduledAt)} at {formatTime(b.scheduledAt)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className={statusColors[b.status] || 'bg-gray-100 text-gray-800'}>{b.status}</Badge>
                      <div className="text-sm text-gray-500 mt-2">{b.duration} min</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      {b.service.price != null && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrencyFromDecimal(b.service.price)}</span>
                        </div>
                      )}
                      {b.notes && <div className="text-xs text-gray-500">{b.notes}</div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/portal/bookings/${b.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
