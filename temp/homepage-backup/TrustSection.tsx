import React from 'react'
import { Shield, Award, Users, Lock, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const trustIndicators = [
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: '256-bit SSL encryption protects all your financial data.'
  },
  {
    icon: Award,
    title: 'Licensed & Certified',
    description: 'CPA certified professionals with 15+ years of industry experience.'
  },
  {
    icon: Users,
    title: '500+ Happy Clients',
    description: 'Trusted by small businesses and enterprises nationwide.'
  },
  {
    icon: Lock,
    title: 'Confidential & Secure',
    description: 'Your financial information is always protected and private.'
  }
]

const certifications = [
  { name: 'CPA Certified', alt: 'CPA Certified' },
  { name: 'QuickBooks ProAdvisor', alt: 'QuickBooks ProAdvisor' },
  { name: 'IRS Authorized', alt: 'IRS Authorized' },
  { name: 'Better Business Bureau A+', alt: 'BBB A+' }
]

export function TrustSection() {
  return (
    <section className="py-12 bg-gray-50" aria-labelledby="trust-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 id="trust-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Why Businesses Trust Us
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Your financial data deserves the highest level of security and professional care. Here&apos;s why hundreds of businesses choose us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {trustIndicators.map((item, index) => {
            const Icon = item.icon
            return (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Professional Certifications & Memberships</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-80">
            {certifications.map((cert, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-gray-700">{cert.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Lock className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" aria-hidden="true" />
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Your Data Security is Our Priority</h4>
              <p className="text-blue-800 leading-relaxed">
                We use industry-standard security measures to protect your financial information. All data is encrypted in transit and at rest, and we never share your information with third parties without your explicit consent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
