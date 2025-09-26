import BookingWizard from '@/components/booking/BookingWizard'

import { BookingProvider } from '@/contexts/BookingContext'

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Book Your Consultation</h1>
            <p className="mt-6 text-xl text-gray-600">
              Schedule a meeting with our expert accounting team. Choose your service, pick a convenient time,
              and let us help you achieve your financial goals.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BookingProvider>
          <BookingWizard />
        </BookingProvider>
      </div>
    </div>
  )
}
