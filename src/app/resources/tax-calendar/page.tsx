import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TaxCalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24 px-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Tax Calendar — Coming Soon</h1>
        <p className="text-lg text-gray-600 mb-8">We're preparing an interactive tax calendar to help you track important filing dates and deadlines. Launching soon.</p>

        <div className="mt-6">
          <Button asChild>
            <Link href="/contact">Request a Reminder</Link>
          </Button>
        </div>

        <div className="mt-8">
          <Link href="/services" className="text-sm text-blue-600 hover:underline">View Services</Link>
        </div>
      </div>
    </div>
  )
}
