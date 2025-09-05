'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Clock, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

interface TimeSlot {
  time: string
  available: boolean
}

export default function BookingPage() {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    clientName: session?.user?.name || '',
    clientEmail: session?.user?.email || '',
    clientPhone: '',
    notes: ''
  })

  const sampleServices: Service[] = [
    {
      id: '1',
      name: 'Free Consultation',
      description: 'Initial consultation to discuss your accounting needs',
      price: 0,
      duration: 30
    },
    {
      id: '2',
      name: 'Tax Preparation Consultation',
      description: 'Discuss your tax situation and preparation needs',
      price: 150,
      duration: 60
    },
    {
      id: '3',
      name: 'Bookkeeping Setup',
      description: 'Set up your bookkeeping system and processes',
      price: 200,
      duration: 90
    },
    {
      id: '4',
      name: 'Business Advisory Session',
      description: 'Strategic financial planning and business advice',
      price: 250,
      duration: 60
    }
  ]

  const generateTimeSlots = (date: string): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const startHour = 9
    const endHour = 17
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time,
          available: Math.random() > 0.3
        })
      }
    }
    
    return slots
  }

  useEffect(() => {
    setServices(sampleServices)
  }, [])

  useEffect(() => {
    if (selectedDate) {
      setTimeSlots(generateTimeSlots(selectedDate))
    }
  }, [selectedDate])

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    setSelectedService(service || null)
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !formData.clientName || !formData.clientEmail) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const bookingData = {
        serviceId: selectedService.id,
        scheduledAt: new Date(`${selectedDate}T${selectedTime}`).toISOString(),
        notes: formData.notes,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      if (response.ok) {
        toast.success('Booking submitted successfully! We will contact you to confirm.')
        setCurrentStep(4)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit booking')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Book Your Consultation
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Schedule a meeting with our expert accounting team. Choose your service, 
              pick a convenient time, and let us help you achieve your financial goals.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-full h-1 mx-4 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Select Service</span>
            <span>Choose Date & Time</span>
            <span>Your Information</span>
          </div>
        </div>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select a Service</CardTitle>
              <p className="text-gray-600">Choose the service that best fits your needs</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <h3 className="font-medium text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration} minutes
                      </span>
                      <span className="font-medium text-blue-600">
                        {service.price === 0 ? 'Free' : `$${service.price}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={nextStep} disabled={!selectedService}>
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Date & Time</CardTitle>
              <p className="text-gray-600">Select your preferred appointment time</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <Label htmlFor="date">Select Date</Label>
                  <Input
                    id="date"
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                {selectedDate && (
                  <div>
                    <Label>Available Times</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2 max-h-64 overflow-y-auto">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? 'default' : 'outline'}
                          size="sm"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className="text-xs"
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedService && selectedDate && selectedTime && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Service:</strong> {selectedService.name}</p>
                    <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {selectedTime}</p>
                    <p><strong>Duration:</strong> {selectedService.duration} minutes</p>
                    <p><strong>Price:</strong> {selectedService.price === 0 ? 'Free' : `$${selectedService.price}`}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={nextStep} disabled={!selectedDate || !selectedTime}>
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <p className="text-gray-600">Please provide your contact details</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="mt-6">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Tell us about your specific needs or any questions you have..."
                />
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Book Appointment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Booking Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Thank you for booking with us. We have received your appointment request and 
                will contact you within 24 hours to confirm your booking.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                <h3 className="font-medium text-gray-900 mb-2">Booking Details:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Service:</strong> {selectedService?.name}</p>
                  <p><strong>Date:</strong> {selectedDate && new Date(selectedDate).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {selectedTime}</p>
                  <p><strong>Contact:</strong> {formData.clientEmail}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/portal">View My Bookings</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Return Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep < 4 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Need help with booking? {' '}
              <Link href="/contact" className="text-blue-600 hover:underline">
                Contact us directly
              </Link>
              {' '} or call{' '}
              <a href="tel:+15551234567" className="text-blue-600 hover:underline">
                (555) 123-4567
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
