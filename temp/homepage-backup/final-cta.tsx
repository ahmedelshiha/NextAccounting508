"use client"
import React from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export function FinalCTASection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-center mb-4">Get Your Free Tax Savings Analysis</h3>
          <div className="space-y-4 mb-6">
            <div className="flex items-center text-green-600"><CheckCircle className="h-5 w-5 mr-3" /><span>Find $3,000+ in missed deductions</span></div>
            <div className="flex items-center text-green-600"><CheckCircle className="h-5 w-5 mr-3" /><span>30-minute CPA consultation included</span></div>
            <div className="flex items-center text-green-600"><CheckCircle className="h-5 w-5 mr-3" /><span>100% money-back guarantee</span></div>
          </div>
          <Button size="lg" className="w-full text-lg py-4 bg-green-600 hover:bg-green-700"
            onClick={() => trackEvent('consultation_requested', { source: 'final_cta' })}
          >
            Claim My Free Analysis (Worth $500)
          </Button>
          <p className="text-xs text-center text-gray-500 mt-3">No credit card required • 5-minute setup • Instant results</p>
        </div>
      </div>
    </section>
  )
}
