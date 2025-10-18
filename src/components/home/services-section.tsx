'use client'


import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { ArrowRight, Calculator, FileText, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyFromDecimal } from '@/lib/decimal-utils'

const serviceIcons = {
  'Bookkeeping': Calculator,
  'Tax Preparation': FileText,
  'Payroll Management': Users,
  'CFO Advisory Services': TrendingUp
}

interface Service {
  id: string
  name: string
  slug: string
  shortDesc?: string | null
  price?: number | null
  featured?: boolean
}

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await apiFetch('/api/services?featured=true')
        if (response.ok) {
          let data: unknown = null
          try {
            data = await response.json()
          } catch {
            data = null
          }

          if (Array.isArray(data)) {
            setServices(data as Service[])
          } else if (data && typeof data === 'object' && Array.isArray((data as { services?: unknown }).services)) {
            setServices(((data as { services: Service[] }).services))
          } else {
            setServices([
              { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true },
              { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true },
              { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Payroll processing and compliance', price: 199, featured: true },
              { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: true }
            ])
          }
        } else {
          // fallback to static featured services when API fails
          setServices([
            { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true },
            { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true },
            { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Payroll processing and compliance', price: 199, featured: true },
            { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: true }
          ])
        }
      } catch {
        setServices([
          { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true },
          { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true },
          { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Payroll processing and compliance', price: 199, featured: true },
          { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: true }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  if (loading) {
    return (
      <section className="py-10 sm:py-12 bg-white" aria-busy="true">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10" role="status" aria-live="polite">
            <span className="sr-only">Loading services…</span>
            <div className="h-8 bg-gray-200 animate-pulse rounded w-64 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded w-96 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_unused, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-10 sm:py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Professional Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive accounting solutions designed to help your business thrive.
            From bookkeeping to strategic advisory, we&apos;ve got you covered.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {services.slice(0, 4).map((service) => {
            const IconComponent = serviceIcons[service.name as keyof typeof serviceIcons] || Calculator

            return (
              <Card
                key={service.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                    <IconComponent className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {service.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 mb-4 leading-relaxed">
                    {service.shortDesc}
                  </CardDescription>
                  
                  {service.price != null && (
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrencyFromDecimal(service.price)}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all"
                    asChild
                  >
                    <Link href={`/services/${service.slug}`}>
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

      </div>
    </section>
  )
}
