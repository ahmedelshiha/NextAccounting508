import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Users, Target, Heart, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'Managing Partner & CPA',
      experience: '15+ years',
      specialties: ['Tax Planning', 'Business Advisory', 'Audit'],
      description: 'Sarah leads our firm with extensive experience in corporate accounting and tax strategy. She holds a CPA certification and has helped over 200 businesses optimize their financial operations.'
    },
    {
      name: 'Michael Chen',
      role: 'Senior Tax Advisor',
      experience: '12+ years',
      specialties: ['Individual Tax', 'Estate Planning', 'IRS Representation'],
      description: 'Michael specializes in complex tax situations and has successfully represented clients in numerous IRS audits. His expertise in tax law helps clients minimize their tax burden legally.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Bookkeeping Manager',
      experience: '8+ years',
      specialties: ['QuickBooks', 'Payroll', 'Financial Reporting'],
      description: 'Emily manages our bookkeeping department and ensures all client records are accurate and up-to-date. She is QuickBooks ProAdvisor certified and specializes in small business accounting.'
    }
  ]

  const values = [
    {
      icon: Target,
      title: 'Accuracy',
      description: 'We maintain the highest standards of precision in all our work, ensuring your financial records are always accurate and compliant.'
    },
    {
      icon: Heart,
      title: 'Integrity',
      description: 'We conduct our business with complete honesty and transparency, building trust through ethical practices and clear communication.'
    },
    {
      icon: Users,
      title: 'Partnership',
      description: 'We view our clients as partners, working collaboratively to achieve your financial goals and business objectives.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We strive for excellence in every service we provide, continuously improving our processes and staying current with industry best practices.'
    }
  ]

  const achievements = [
    { number: '500+', label: 'Happy Clients' },
    { number: '15+', label: 'Years Experience' },
    { number: '2,000+', label: 'Tax Returns Filed' },
    { number: '99%', label: 'Client Satisfaction' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              About Accounting Firm
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              For over 15 years, we have been helping businesses and individuals achieve 
              their financial goals through expert accounting services and strategic guidance.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                We empower businesses and individuals to achieve financial success through 
                comprehensive accounting services, strategic planning, and personalized guidance. 
                Our mission is to be your trusted financial partner, providing the expertise 
                and support you need to make informed decisions and reach your goals.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                We believe that every business deserves access to professional accounting 
                services that are both reliable and affordable. Our team is committed to 
                delivering exceptional value while maintaining the highest standards of 
                accuracy and integrity.
              </p>
              <Button asChild>
                <Link href="/services">Explore Our Services</Link>
              </Button>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Us?</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Certified Public Accountants with extensive experience</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Personalized service tailored to your specific needs</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Proactive tax planning to minimize your liability</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Modern technology for efficient and accurate service</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Responsive communication and ongoing support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Core Values</h2>
            <p className="mt-4 text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="mx-auto p-3 bg-blue-100 rounded-full w-fit">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Meet Our Team</h2>
            <p className="mt-4 text-lg text-gray-600">
              Experienced professionals dedicated to your financial success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-10 w-10 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{member.name}</CardTitle>
                    <p className="text-blue-600 font-medium">{member.role}</p>
                    <p className="text-sm text-gray-500">{member.experience}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{member.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Specialties:</p>
                    <div className="flex flex-wrap gap-2">
                      {member.specialties.map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Our Track Record</h2>
            <p className="mt-4 text-xl text-blue-100">
              Numbers that speak to our commitment and success
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {achievement.number}
                </div>
                <div className="text-blue-100 text-lg">
                  {achievement.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Ready to Work Together?
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Let us help you achieve your financial goals with our expert accounting services
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/booking">Schedule Consultation</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export const metadata = {
  title: 'About Us | Accounting Firm',
  description: 'Learn about our experienced team of CPAs and accounting professionals. Over 15 years of helping businesses achieve their financial goals.',
  keywords: 'about accounting firm, CPA team, accounting professionals, business advisory, tax experts',
}
