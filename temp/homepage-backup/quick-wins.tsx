"use client"
import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, Clock, TrendingUp } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export function QuickWinsSection() {
  const quickWins = [
    {
      icon: Calculator,
      title: 'Free Tax Review',
      description: 'Find missed deductions from last year',
      savings: 'Average savings: $3,200',
      time: '30 minutes',
      cta: 'Get Free Review',
      event: 'quick_win_tax_review'
    },
    {
      icon: Clock,
      title: 'Bookkeeping Cleanup',
      description: 'Get your books caught up and organized',
      savings: 'Save 10+ hours/month',
      time: '1 week',
      cta: 'Start Cleanup',
      event: 'quick_win_cleanup'
    },
    {
      icon: TrendingUp,
      title: 'Cash Flow Analysis',
      description: 'Identify opportunities to improve cash flow',
      savings: 'Improve cash flow by 25%','time':'Same day',
      cta: 'Get Analysis',
      event: 'quick_win_cashflow'
    }
  ] as const

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Wins for Your Business</h2>
          <p className="text-xl text-gray-600">Get immediate value while we set up your long-term accounting solution</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {quickWins.map((win, idx) => (
            <Card key={idx} className="p-6 text-center hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <win.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{win.title}</h3>
              <p className="text-gray-600 mb-4">{win.description}</p>
              <div className="space-y-2 mb-6">
                <div className="text-green-600 font-semibold">{win.savings}</div>
                <div className="text-sm text-gray-500">Completion time: {win.time}</div>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={() => trackEvent('calculator_used', { source: win.event })}
              >
                {win.cta}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Start with any quick win, then upgrade to full accounting services</p>
          <Button size="lg" variant="outline" asChild>
            <Link href="/consultation" onClick={() => trackEvent('consultation_requested', { source: 'quick_wins_footer' })}>
              Schedule Free Strategy Call
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
