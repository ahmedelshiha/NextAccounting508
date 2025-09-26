"use client"

import Link from 'next/link'
import { ArrowRight, CheckCircle, Shield, Star, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'

export default function LandingVariantA() {
  return (
    <main>
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 lg:py-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-5">
              <Star className="h-4 w-4" />
              <span>Rated 4.9/5 by growing businesses</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-3">
              Get your books, taxes, and payroll handled the right way
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              We set you up in days, not weeks—transparent pricing, proactive tax savings, and a dedicated CPA.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="group" onClick={() => trackEvent('consultation_requested', { source: 'landing_variant_a' })}>
                <Link href="/booking">
                  Start Free Consultation
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#pricing">See Pricing</Link>
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-center text-sm text-gray-700"><CheckCircle className="h-4 w-4 text-green-600 mr-2"/>Money‑back guarantee</div>
              <div className="flex items-center justify-center text-sm text-gray-700"><Timer className="h-4 w-4 text-blue-600 mr-2"/>Onboarded in 5 days</div>
              <div className="flex items-center justify-center text-sm text-gray-700"><Shield className="h-4 w-4 text-indigo-600 mr-2"/>Bank‑grade security</div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-10 sm:py-12 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">Simple, transparent pricing</h2>
          <p className="text-gray-600 text-center mb-8">Pick a plan that fits your stage—upgrade any time.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: 299, features: ['Monthly bookkeeping','Annual tax filing','Email support'] },
              { name: 'Growth', price: 599, features: ['Weekly bookkeeping','Quarterly tax planning','Priority support'] },
              { name: 'Scale', price: 1299, features: ['Daily bookkeeping','Dedicated CFO advisory','Priority phone support'] },
            ].map((tier) => (
              <div key={tier.name} className="rounded-2xl shadow-lg p-6 border hover:-translate-y-1 transition-transform">
                <div className="text-xl font-semibold text-gray-900 mb-1">{tier.name}</div>
                <div className="text-3xl font-bold text-blue-600 mb-4">${tier.price}<span className="text-base text-gray-600">/mo</span></div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center text-gray-700"><CheckCircle className="h-4 w-4 text-green-600 mr-2" /> {f}</li>
                  ))}
                </ul>
                <Button className="w-full" asChild onClick={() => trackEvent('plan_selected', { plan: tier.name, source: 'landing_variant_a' })}>
                  <Link href="/booking">Choose {tier.name}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
