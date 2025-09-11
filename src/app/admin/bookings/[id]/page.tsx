import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Mail, Phone, DollarSign, Users } from 'lucide-react'
import { formatCurrencyFromDecimal } from '@/lib/decimal-utils'

interface Props {
  params: { id: string }
}

export default async function AdminBookingDetail({ params }: Props) {
  const { id } = params
  const session = await getServerSession(authOptions)
  if (!session?.user) return notFound()

  const isAdminOrStaff = ['ADMIN', 'STAFF'].includes((session.user as { role?: string }).role ?? '')
  if (!isAdminOrStaff) return notFound()

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: { select: { id: true, name: true, slug: true, duration: true, price: true, description: true } },
      client: { select: { id: true, name: true, email: true, phone: true } }
    }
  })

  if (!booking) return notFound()

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600">Administrative view of a client appointment.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/bookings">Back to Bookings</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between w-full">
              <div>
                <CardTitle className="text-lg">{booking.service?.name ?? 'Service'}</CardTitle>
                <CardDescription>
                  {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge className={booking.status ? (booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800') : 'bg-gray-100 text-gray-800'}>
                  {booking.status}
                </Badge>
                <div className="text-sm text-gray-500 mt-2">{booking.duration} min</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(booking.scheduledAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{formatTime(booking.scheduledAt)}</span>
                </div>
                {booking.service?.price != null && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>{formatCurrencyFromDecimal(booking.service.price)}</span>
                  </div>
                )}
                {booking.notes && (
                  <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                    {booking.notes}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{booking.client?.name ?? 'Unknown Client'}</span>
                </div>
                {booking.client?.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a className="text-blue-600" href={`mailto:${booking.client.email}`}>{booking.client.email}</a>
                  </div>
                )}
                {booking.client?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a className="text-blue-600" href={`tel:${booking.client.phone}`}>{booking.client.phone}</a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
