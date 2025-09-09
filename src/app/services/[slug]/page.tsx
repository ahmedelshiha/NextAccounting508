import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { Metadata } from 'next'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params
  try {
    const service = await prisma.service.findUnique({ where: { slug } })
    if (!service) return { title: 'Service not found' }
    return {
      title: `${service.name} | Accounting Firm Services`,
      description: service.description || undefined,
    }
  } catch (err) {
    return { title: 'Service' }
  }
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = params

  try {
    const service = await prisma.service.findUnique({ where: { slug } })
    if (!service) return notFound()

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">{service.name}</h1>
            {service.price && <div className="text-lg text-blue-600 mt-2">Starting at ${service.price}</div>}
            <p className="mt-4 text-gray-600">{service.shortDesc || service.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Overview</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {service.features && Array.isArray(service.features) && (
                    <ul className="list-disc pl-5 space-y-2 mb-6">
                      {service.features.map((f: string, i: number) => (
                        <li key={i} className="text-gray-700">{f}</li>
                      ))}
                    </ul>
                  )}

                  <div className="prose max-w-none">
                    {/* If rich content exists, render it here; fallback to shortDesc */}
                    {service.description}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside>
              <Card>
                <CardHeader>
                  <CardTitle>Get Started</CardTitle>
                  <CardDescription>Book this service or ask a question</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button asChild className="w-full">
                      <Link href={`/booking?service=${encodeURIComponent(service.slug)}`}>Book This Service</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/contact?service=${encodeURIComponent(service.slug)}`}>Contact Us</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>More Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {/* List core services with links */}
                    <li><Link href="/services/bookkeeping" className="text-blue-600 hover:underline">Bookkeeping</Link></li>
                    <li><Link href="/services/tax-preparation" className="text-blue-600 hover:underline">Tax Preparation</Link></li>
                    <li><Link href="/services/payroll" className="text-blue-600 hover:underline">Payroll Management</Link></li>
                    <li><Link href="/services/cfo-advisory" className="text-blue-600 hover:underline">CFO Advisory</Link></li>
                  </ul>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading service page:', error)
    return notFound()
  }
}

export async function generateStaticParams() {
  try {
    const services = await prisma.service.findMany({ where: { active: true }, select: { slug: true } })
    return services.map((s) => ({ slug: s.slug }))
  } catch (error) {
    return []
  }
}
