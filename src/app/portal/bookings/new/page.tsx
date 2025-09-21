'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BookingWizard from '@/components/booking/BookingWizard'
import { Button } from '@/components/ui/button'
import { BookingProvider } from '@/contexts/BookingContext'

export default function PortalNewBookingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book a New Appointment</h1>
            <p className="text-gray-600">Choose a service, pick a time, and provide your details.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/portal/bookings">Back to Appointments</Link>
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
