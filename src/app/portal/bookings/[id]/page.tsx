'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, DollarSign } from 'lucide-react'
import { formatCurrencyFromDecimal } from '@/lib/decimal-utils'

interface BookingDetail {
  id: string
  scheduledAt: string
  status: string
  service: { name: string; price?: number }
  duration: number
  notes?: string
}

export default function PortalBookingDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const { data: session } = useSession()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/bookings/${id}`)
        if (!res.ok) {
          // Not found or unauthorized
          router.replace('/portal')
          return
        }
        const json = await res.json()
        setBooking(json)
      } catch (e) {
        console.error('Failed to load booking', e)
        router.replace('/portal')
      } finally {
        setLoading(false)
      }
    }

    if (session) load()
  }, [id, session, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-200 animate-pulse rounded-lg h-36" />
        </div>
      </div>
    )
  }

  if (!booking) return null

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
            <p className="text-gray-600">Details for your scheduled appointment.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/portal/bookings">Back to Appointments</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/portal">Back to Portal</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between w-full">
              <div>
                <CardTitle className="text-lg">{booking.service.name}</CardTitle>
                <CardDescription>
                  {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge className={booking.status ? (booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800') : 'bg-gray-100 text-gray-800'}>
                  {booking.status}
                </Badge>
                <div className="text-sm text-gray-500 mt-2">{booking.duration} min</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {booking.service.price != null && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatCurrencyFromDecimal(booking.service.price)}</span>
                </div>
              )}

              {booking.notes && (
                <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                  {booking.notes}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
