import Link from 'next/link'
import prisma from '@/lib/prisma'
import { ArrowRight, Calculator, FileText, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
  shortDesc: string
  price: number | null
  featured: boolean
}

export async function ServicesSection() {
  const hasDb = !!process.env.NETLIFY_DATABASE_URL

  let services: Service[] = []

  // Normalize potential Prisma Decimal values safely without using `any`
  function normalizePrice(p: unknown): number | null {
    if (p == null) return null
    // Prisma Decimal objects often expose a toNumber() method
    if (typeof p === 'object\' && p !== null' in (p as Record<string, unknown>)) {
      const maybe = p as Record<string, unknown>
      const toNumber = maybe['toNumber']
      if (typeof toNumber === 'function') {
        try {
          return (toNumber as () => number)()
        } catch {
          // ignore and fallback
        }
      }
    }

    if (typeof p === 'number') return p
    if (typeof p === 'string') {
      const n = Number(p)
      return Number.isFinite(n) ? n : null
    }

    return null
  }

  if (hasDb) {
    try {
      const dbServices = await prisma.service.findMany({
        where: { active: true, featured: true },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          name: true,
          slug: true,
          shortDesc: true,
          price: true,
          featured: true,
        },
        take: 8,
      })

      services = dbServices.map((s) => ({
        id: String(s.id),
        name: String(s.name),
        slug: String(s.slug),
        shortDesc: String(s.shortDesc),
        price: normalizePrice((s as unknown as { price?: unknown }).price),
        featured: Boolean(s.featured),
      })) as Service[]
    } catch {
      services = []
    }
  }

  if (services.length === 0) {
    services = [
      { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true },
      { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true },
      { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Payroll processing and compliance', price: 199, featured: true },
      { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: true }
    ]
  }

  return (
    <section className="py-12 sm:py-16 bg-white">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {services.map((service) => {
            const IconComponent = serviceIcons[service.name as keyof typeof serviceIcons] || Calculator

            return (
              <Card 
                key={service.id} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                    <IconComponent className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {service.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 mb-4 leading-relaxed">
                    {service.shortDesc}
                  </CardDescription>
                  {typeof service.price === 'number' && (
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        ${service.price}
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

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 sm:p-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Need a Custom Solution?
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Every business is unique. Let&apos;s discuss how we can tailor our services
            to meet your specific accounting and financial needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">
                Get Custom Quote
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/services">
                View All Services
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export const revalidate = 60
