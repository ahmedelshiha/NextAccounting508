'use client'

'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Calendar, Clock, DollarSign, FileText, Plus, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyFromDecimal } from '@/lib/decimal-utils'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { useTranslations } from '@/lib/i18n'
import { SecureDocumentUpload } from '@/components/portal/secure-document-upload'
import { FinancialDashboard } from '@/components/portal/financial-dashboard'
import { MessageCenter } from '@/components/communication/message-center'
import { DeadlineTracker } from '@/components/tax/deadline-tracker'

interface Booking {
  id: string
  scheduledAt: string
  status: string
  service: {
    name: string
    price?: number
  }
  duration: number
  notes?: string
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function PortalPage() {
  const { t } = useTranslations()
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookings() {
      try {
        const response = await apiFetch('/api/bookings')
        if (response.ok) {
          const json = await response.json().catch(() => null as any)
          const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : [])
          setBookings(list as any)
        }
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchBookings()
    }
  }, [session])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const [filter, setFilter] = useState<'all'|'upcoming'|'past'>('upcoming')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const upcomingBookings = bookings.filter(booking =>
    new Date(booking.scheduledAt) > new Date() &&
    ['PENDING', 'CONFIRMED'].includes(booking.status)
  )

  const pastBookings = bookings.filter(booking =>
    new Date(booking.scheduledAt) <= new Date() ||
    ['COMPLETED', 'CANCELLED'].includes(booking.status)
  )


  const handleCancel = async (id: string) => {
    if (!confirm(t('portal.confirmCancel'))) return
    setDeletingId(id)
    try {
      const res = await apiFetch(`/api/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
        toast.success(t('portal.toast.cancelled'))
      } else {
        const errBody = await res.json().catch(() => ({}))
        toast.error(getApiErrorMessage(errBody, t('portal.toast.cancelFailed')))
      }
    } catch (e) {
      console.error('Cancel error', e)
      toast.error(t('portal.toast.cancelFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  const exportCSV = () => {
    if (!bookings.length) return
    const rows = bookings.map(b => ({
      id: b.id,
      service: b.service.name,
      date: new Date(b.scheduledAt).toLocaleDateString(),
      time: new Date(b.scheduledAt).toLocaleTimeString(),
      status: b.status
    }))
    const header = Object.keys(rows[0]).join(',')
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('portal.welcome', { name: session?.user?.name || '' })}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('portal.subtitle')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('portal.bookNew')}</CardTitle>
              <Plus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" aria-label={t('portal.scheduleConsultation')}>
                <Link href="/booking">
                  {t('portal.scheduleConsultation')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">{t('portal.totalBookings')}</CardTitle>
                <CardDescription className="text-xs">{bookings.length} {t('portal.total')}</CardDescription>
              </div>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings.length}</div>
              <p className="text-xs text-gray-600">
                {t('portal.upcoming')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('portal.actions')}</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={exportCSV} size="sm" className="w-full sm:w-auto">{t('common.export')}</Button>
                <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'upcoming' | 'past')} className="border border-gray-300 rounded px-2 py-1 text-sm" aria-label={t('portal.filter.timeRange')}>
                  <option value="upcoming">{t('portal.filter.upcoming')}</option>
                  <option value="past">{t('portal.filter.past')}</option>
                  <option value="all">{t('portal.filter.all')}</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Overview</h2>
          <FinancialDashboard bookings={bookings as any} />
        </div>

        {/* Tax Deadlines */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tax Deadlines</h2>
          <DeadlineTracker />
        </div>

        {/* Messages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
          <MessageCenter />
        </div>

        {/* Documents */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Documents</h2>
          <SecureDocumentUpload />
        </div>

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('portal.upcomingAppointments')}</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-32"></div>
              ))}
            </div>
          ) : upcomingBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{booking.service.name}</CardTitle>
                        <CardDescription>
                          {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}
                        </CardDescription>
                      </div>
                      <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                        {booking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {booking.duration} min
                        </div>
                        {booking.service.price && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatCurrencyFromDecimal(booking.service.price)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/portal/bookings/${booking.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            {t('portal.viewDetails')}
                          </Link>
                        </Button>
                        {['PENDING','CONFIRMED'].includes(booking.status) && (
                          <Button variant="destructive" size="sm" onClick={() => handleCancel(booking.id)} disabled={deletingId === booking.id} aria-label={t('portal.cancel')}>
                            {deletingId === booking.id ? t('portal.cancelling') : t('portal.cancel')}
                          </Button>
                        )}
                      </div>
                    </div>
                    {booking.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{booking.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('portal.noUpcoming')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('portal.noUpcomingDescription')}
                </p>
                <Button asChild aria-label={t('portal.bookAppointment')}>
                  <Link href="/booking">
                    {t('portal.bookAppointment')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Past Appointments */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('portal.pastAppointments')}</h2>
            <div className="space-y-4">
              {pastBookings.slice(0, 5).map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium text-gray-900">{booking.service.name}</h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                          {booking.status}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/portal/bookings/${booking.id}`}>
                            {t('portal.view')}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pastBookings.length > 5 && (
                <div className="text-center">
                  <Button variant="outline" asChild>
                    <Link href="/portal/bookings">
                      {t('portal.viewAllAppointments')}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
