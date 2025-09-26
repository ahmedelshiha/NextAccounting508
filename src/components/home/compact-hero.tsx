"use client"

import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CompactHero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-6 lg:py-8">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-2">
              Expert accounting that helps your business grow
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-4">
              Bookkeeping, tax, payroll, and advisory—delivered with speed and accuracy so you can focus on growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="group">
                <Link href="/booking">
                  Book Free Consultation
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/services">Explore Services</Link>
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center text-sm text-gray-700"><CheckCircle className="h-4 w-4 text-green-600 mr-2"/>Average client savings $3,000+/yr</div>
              <div className="flex items-center text-sm text-gray-700"><CheckCircle className="h-4 w-4 text-green-600 mr-2"/>Setup in 5 minutes</div>
            </div>
          </div>
          <div className="w-full lg:w-auto">
            <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-md">
              <div className="text-sm text-gray-600 mb-2">This Month</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">$42k</div>
                  <div className="text-xs text-blue-700">Revenue</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-600">$9k</div>
                  <div className="text-xs text-green-700">Tax Saved</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-indigo-600">99%</div>
                  <div className="text-xs text-indigo-700">On-time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
