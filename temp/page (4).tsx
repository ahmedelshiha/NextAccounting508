import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calculator, FileText, Users, TrendingUp, Shield, Clock, Award } from 'lucide-react'
import Link from 'next/link'

export default function ServicesPage() {
  const services = [
    {
      id: 'bookkeeping',
      title: 'Professional Bookkeeping',
      description: 'Comprehensive bookkeeping services to keep your financial records accurate and up-to-date.',
      price: 'Starting at $299/month',
      features: [
        'Monthly financial statements',
        'Accounts payable/receivable management',
        'Bank reconciliation',
        'Expense categorization',
        'QuickBooks setup and maintenance',
        'Monthly financial review calls'
      ],
      icon: Calculator,
      popular: false
    },
    {
      id: 'tax-preparation',
      title: 'Tax Preparation & Planning',
      description: 'Expert tax preparation and strategic planning to minimize your tax liability.',
      price: 'Starting at $450',
      features: [
        'Individual and business tax returns',
        'Tax planning consultations',
        'IRS representation',
        'Quarterly estimated tax payments',
        'Multi-state tax filing',
        'Tax audit support'
      ],
      icon: FileText,
      popular: true
    },
    {
      id: 'payroll',
      title: 'Payroll Management',
      description: 'Complete payroll processing and compliance management for your business.',
      price: 'Starting at $199/month',
      features: [
        'Bi-weekly or monthly payroll processing',
        'Direct deposit setup',
        'Tax withholding and filing',
        'Employee self-service portal',
        'Workers compensation reporting',
        'Year-end W-2 and 1099 processing'
      ],
      icon: Users,
      popular: false
    },
    {
      id: 'cfo-advisory',
      title: 'CFO Advisory Services',
      description: 'Strategic financial guidance to help your business grow and thrive.',
      price: 'Starting at $1,200/month',
      features: [
        'Financial strategy development',
        'Cash flow management',
        'Budget planning and analysis',
        'KPI dashboard creation',
        'Investor relations support',
        'Monthly executive reports'
      ],
      icon: TrendingUp,
      popular: false
    }
  ]

  const additionalServices = [
    {
      title: 'Business Formation',
      description: 'LLC, Corporation, and Partnership setup services',
      icon: Shield
    },
    {
      title: 'Financial Consulting',
      description: 'One-time consulting for specific financial challenges',
      icon: Award
    },
    {
      title: 'Audit Support',
      description: 'Preparation and support for financial audits',
      icon: Clock
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Professional Accounting Services
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Comprehensive financial solutions designed to help your business thrive. 
              From bookkeeping to strategic advisory, we have got you covered.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/booking">Get Free Consultation</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Core Services</h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose from our comprehensive range of accounting and financial services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => {
              const IconComponent = service.icon
              return (
                <Card key={service.id} className={`relative ${service.popular ? 'ring-2 ring-blue-500' : ''}`}>
                  {service.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{service.title}</CardTitle>
                        <div className="text-lg font-semibold text-blue-600 mt-1">
                          {service.price}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-base mt-3">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" asChild>
                      <Link href="/booking">Get Started</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Additional Services</h2>
            <p className="mt-4 text-lg text-gray-600">
              Specialized services to meet your unique business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {additionalServices.map((service, index) => {
              const IconComponent = service.icon
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="mx-auto p-3 bg-blue-100 rounded-full w-fit">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                    <CardDescription className="text-base">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild>
                      <Link href="/contact">Learn More</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Schedule a free consultation to discuss your accounting needs
          </p>
          <div className="mt-8">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/booking">Book Free Consultation</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export const metadata = {
  title: 'Professional Accounting Services | Accounting Firm',
  description: 'Comprehensive accounting services including bookkeeping, tax preparation, payroll management, and CFO advisory services for growing businesses.',
  keywords: 'accounting services, bookkeeping, tax preparation, payroll, CFO advisory, business accounting',
}

