"use client"

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, ArrowRight, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import TouchCalendar from '@/components/mobile/TouchCalendar'
import TeamMemberSelection from '@/components/booking/steps/TeamMemberSelection'

export type Service = {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

export type TimeSlot = { time: string; available: boolean; priceCents?: number; currency?: string }

export type BookingForm = {
  clientName: string
  clientEmail: string
  clientPhone: string
  notes: string
}

export type BookingWizardProps = {
  serviceId?: string
  onComplete?: () => void
}

export default function BookingWizard(props: BookingWizardProps) {
  const { data: session } = useSession()

  const [currentStep, setCurrentStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currencies, setCurrencies] = useState<{ code: string; name: string; symbol?: string; isDefault?: boolean }[]>([])
  const [currency, setCurrency] = useState<string>('USD')
  const [promoInput, setPromoInput] = useState<string>('')
  const [promoCode, setPromoCode] = useState<string>('')

  const [formData, setFormData] = useState<BookingForm>({
    clientName: session?.user?.name || '',
    clientEmail: session?.user?.email || '',
    clientPhone: '',
    notes: ''
  })

  // Initialize user data from session when available
  useEffect(() => {
    if (!session?.user) return
    setFormData(prev => ({
      ...prev,
      clientName: prev.clientName || session.user.name || '',
      clientEmail: prev.clientEmail || session.user.email || ''
    }))
  }, [session])

  // Load services list from API (fallback to empty list on failure)
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await apiFetch('/api/services')
        if (res.ok) {
          type ApiService = { id: string; name: string; shortDesc?: string | null; description: string; price?: number | null; duration?: number | null }
          const data = (await res.json()) as ApiService[]
          const mapped: Service[] = Array.isArray(data)
            ? data.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.shortDesc || s.description,
                price: s.price ?? 0,
                duration: s.duration ?? 60,
              }))
            : []
          setServices(mapped)
          if (props.serviceId) {
            const preset = mapped.find(s => s.id === props.serviceId) || null
            setSelectedService(preset)
          }
        }
      } catch {
        setServices([])
      }
    }
    loadServices()
  }, [props.serviceId])

  // Load active currencies for selection
  useEffect(() => {
    async function loadCurrencies() {
      try {
        const res = await apiFetch('/api/currencies')
        if (res.ok) {
          const list = (await res.json()) as { code: string; name: string; symbol?: string; isDefault?: boolean }[]
          setCurrencies(list)
          const def = list.find(c => c.isDefault) || list[0]
          if (def?.code) setCurrency(def.code)
        }
      } catch {
        // ignore
      }
    }
    loadCurrencies()
  }, [])

  // Availability loader for a selected service/date
  useEffect(() => {
    async function loadAvailability() {
      if (!selectedService || !selectedDate) return
      try {
        const res = await apiFetch(`/api/bookings/availability?serviceId=${encodeURIComponent(selectedService.id)}&date=${encodeURIComponent(selectedDate)}&days=1&includePrice=1&currency=${encodeURIComponent(currency)}${promoCode ? `&promoCode=${encodeURIComponent(promoCode)}` : ''}${selectedTeamMemberId ? `&teamMemberId=${encodeURIComponent(selectedTeamMemberId)}` : ''}`)
        if (res.ok) {
          const json = await res.json().catch(() => null)
          type ApiDay = { date: string; slots: { start: string; available?: boolean; priceCents?: number; currency?: string }[] }
          const availability: ApiDay[] = Array.isArray(json)
            ? (json as ApiDay[])
            : json && typeof json === 'object' && Array.isArray((json as { availability?: unknown }).availability)
            ? ((json as { availability: ApiDay[] }).availability)
            : []

          const day = availability.find((d) => d.date === selectedDate) || availability[0]
          if (day && Array.isArray(day.slots) && day.slots.length > 0) {
            const slots: TimeSlot[] = day.slots.map((s) => ({
              time: new Date(s.start).toTimeString().slice(0, 5),
              available: s.available !== false,
              priceCents: typeof s.priceCents === 'number' ? s.priceCents : undefined,
              currency: s.currency,
            }))
            setTimeSlots(slots)
            return
          }
        }
      } catch {
        // ignore, fallback below
      }
      // Fallback: generate simple slots if API fails
      const slots: TimeSlot[] = []
      const startHour = 9
      const endHour = 17
      for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += 30) {
          const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
          slots.push({ time, available: true })
        }
      }
      setTimeSlots(slots)
    }
    loadAvailability()
  }, [selectedDate, selectedService, currency, promoCode, selectedTeamMemberId])

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const nextStep = () => setCurrentStep((s) => Math.min(5, s + 1))
  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1))

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !formData.clientName || !formData.clientEmail) {
      toast.error('Please fill in all required fields')
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        serviceId: selectedService.id,
        scheduledAt: new Date(`${selectedDate}T${selectedTime}`).toISOString(),
        notes: formData.notes,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
      }
      const res = await apiFetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        toast.success('Booking submitted successfully! We will contact you to confirm.')
        setCurrentStep(4)
        props.onComplete?.()
      } else {
        const err = await res.json().catch(() => ({} as any))
        toast.error(err?.error || 'Failed to submit booking')
      }
    } catch (e) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatCents(cents: number, curr: string | undefined) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: curr || 'USD' }).format((cents || 0) / 100)
    } catch {
      return `$${(cents / 100).toFixed(2)}`
    }
  }

  const estimatedPrice = useMemo(() => {
    if (!selectedService) return null
    const slot = timeSlots.find(t => t.time === selectedTime)
    if (slot && typeof slot.priceCents === 'number') return formatCents(slot.priceCents, slot.currency)
    const base = Number(selectedService.price || 0)
    return base > 0 ? formatCents(Math.round(base * 100), 'USD') : 'Free'
  }, [selectedService, selectedTime, timeSlots])

  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              {step < 4 && <div className={`w-full h-1 mx-4 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Select Service</span>
          <span>Choose Specialist</span>
          <span>Date & Time</span>
          <span>Your Information</span>
        </div>
      </div>

      {/* Step 1: Service selection */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select a Service</CardTitle>
            <p className="text-gray-600">Choose the service that best fits your needs</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={`text-left p-4 border rounded-lg transition-all ${selectedService?.id === service.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setSelectedService(service)}
                >
                  <h3 className="font-medium text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {service.duration} minutes
                    </span>
                    <span className="font-medium text-blue-600">{service.price === 0 ? 'Free' : `$${service.price}`}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setCurrentStep(2)} disabled={!selectedService}>
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Team member selection (optional) */}
      {currentStep === 2 && (
        <TeamMemberSelection serviceId={selectedService?.id} value={selectedTeamMemberId} onChange={(id) => { setSelectedTeamMemberId(id); setSelectedTime(''); }} />
      )}

      {/* Step 3: Date & time */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Date & Time</CardTitle>
            <p className="text-gray-600">Select your preferred appointment time</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="date">Select Date</Label>
                  <Input id="date" type="date" min={today} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime('') }} className="mt-1" />
                </div>
                <div className="block md:hidden">
                  <TouchCalendar value={selectedDate} min={today} onChange={(d) => { setSelectedDate(d); setSelectedTime('') }} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label htmlFor="currency">Currency</Label>
                    <select id="currency" className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 bg-white" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      {currencies.map(c => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="promo">Promo Code</Label>
                    <div className="mt-1 flex gap-2">
                      <Input id="promo" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="e.g. WELCOME10" />
                      <Button type="button" variant="outline" onClick={() => setPromoCode(promoInput.trim())}>Apply</Button>
                    </div>
                  </div>
                </div>
              </div>

              {selectedDate && (
                <div>
                  <Label>Available Times</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2 max-h-64 overflow-y-auto">
                    {timeSlots.map((slot) => (
                      <Button key={slot.time} variant={selectedTime === slot.time ? 'default' : 'outline'} size="sm" disabled={!slot.available} onClick={() => setSelectedTime(slot.time)} className="text-xs">
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
                  <p><strong>Price:</strong> {estimatedPrice}{promoCode ? ` (after promo ${promoCode})` : ''}</p>
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

      {/* Step 4: Client info */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <p className="text-gray-600">Please provide your contact details</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" type="text" required value={formData.clientName} onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))} placeholder="Your full name" />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" required value={formData.clientEmail} onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))} placeholder="your@email.com" />
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={formData.clientPhone} onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))} placeholder="(555) 123-4567" />
            </div>

            <div className="mt-6">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" rows={4} value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Tell us about your specific needs or any questions you have..." />
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

      {/* Step 5: Confirmation */}
      {currentStep === 5 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">Thank you for booking with us. We have received your appointment request and will contact you within 24 hours to confirm your booking.</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
              <h3 className="font-medium text-gray-900 mb-2">Booking Details:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Service:</strong> {selectedService?.name}</p>
                <p><strong>Date:</strong> {selectedDate && new Date(selectedDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Contact:</strong> {formData.clientEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep < 4 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Need help with booking?{' '}
            <a href="/contact" className="text-blue-600 hover:underline">Contact us directly</a>
            {' '} or call{' '}
            <a href="tel:+15551234567" className="text-blue-600 hover:underline">(555) 123-4567</a>
          </p>
        </div>
      )}
    </div>
  )
}
