import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import trackConversion from '@/lib/analytics'

export function ConversionOptimizedCTAs() {
  const handleBook = () => {
    trackConversion('book_consultation', { service: 'general', value: 0 })
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to Simplify Your Accounting?</h3>
          <p className="text-blue-100 mb-6">Join 500+ businesses who trust us with their financial success</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-white/90" asChild>
              <Link href="/booking" onClick={handleBook}>
                Book Free Consultation
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="tel:+15551234567">Call (555) 123-4567</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="text-center bg-gray-50 p-8 rounded-xl">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Not Sure Which Service You Need?</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">Our accounting experts will analyze your business and recommend the perfect solution. No obligation, completely free.</p>
        <Button size="lg" asChild>
          <Link href="/consultation">Get Free Business Analysis</Link>
        </Button>
      </div>
    </div>
  )
}
