'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BookingWizard from '@/components/booking/BookingWizard'
import { Button } from '@/components/ui/button'
import { BookingProvider } from '@/contexts/BookingContext'
import { useTranslations } from '@/lib/i18n'

export default function PortalNewBookingPage() {
  const router = useRouter()
  const { t } = useTranslations()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('portal.bookings.new.title')}</h1>
            <p className="text-gray-600">{t('portal.bookings.new.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild aria-label={t('portal.bookings.backToAppointments')}>
              <Link href="/portal/bookings">{t('portal.bookings.backToAppointments')}</Link>
            </Button>
          </div>
        </div>

        <BookingProvider>
          <BookingWizard onComplete={() => router.push('/portal/bookings')} />
        </BookingProvider>
      </div>
    </div>
  )
}
