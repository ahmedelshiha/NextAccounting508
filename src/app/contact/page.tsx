'use client'


import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Phone, Mail, Clock, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { ContactForm } from '@/components/forms/ContactForm'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Message sent successfully! We will get back to you soon.')
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          subject: '',
          message: ''
        })
      } else {
        toast.error('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Contact form submission error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Office Location',
      details: ['123 Business Street, Suite 100', 'Business City, BC 12345'],
      action: 'Get Directions'
    },
    {
      icon: Phone,
      title: 'Phone Number',
      details: ['(555) 123-4567', 'Toll-free: (800) 123-4567'],
      action: 'Call Now'
    },
    {
      icon: Mail,
      title: 'Email Address',
      details: ['info@accountingfirm.com', 'support@accountingfirm.com'],
      action: 'Send Email'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Monday - Friday: 8:00 AM - 6:00 PM', 'Saturday: 9:00 AM - 2:00 PM'],
      action: 'Schedule Meeting'
    }
  ]

  const services = [
    'Bookkeeping Services',
    'Tax Preparation',
    'Payroll Management',
    'CFO Advisory',
    'Business Formation',
    'Financial Consulting',
    'Audit Support',
    'Other'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Contact Us
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Ready to take control of your finances? Get in touch with our expert team 
              for a free consultation and discover how we can help your business thrive.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            {/* Reusable ContactForm component extracted from page for reuse and testability */}
            <ContactForm />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <p className="text-gray-600">
                  Multiple ways to reach our team
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{info.title}</h3>
                        {info.details.map((detail, idx) => (
                          <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Free initial consultation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Certified Public Accountants</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>15+ years of experience</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Personalized service approach</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Competitive pricing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-blue-50">
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2">Emergency Support</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Need urgent assistance with tax deadlines or financial issues?
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Call Emergency Line
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FAQSection
            items={[
              { question: 'How quickly can you respond?', answer: 'We typically respond to all inquiries within 24 hours during business days, and often much sooner for urgent matters.' },
              { question: 'Do you offer free consultations?', answer: 'Yes! We offer a complimentary 30-minute consultation to discuss your needs and how we can help your business.' },
              { question: 'What areas do you serve?', answer: 'We serve clients locally and nationwide, with both in-person and remote service options available.' },
              { question: 'How do you ensure data security?', answer: 'We use bank-level encryption and secure cloud platforms to protect all client data and maintain strict confidentiality.' }
            ]}
            heading="Frequently Asked Questions"
            description="Quick answers to common questions"
          />
        </div>
      </section>
    </div>
  )
}
