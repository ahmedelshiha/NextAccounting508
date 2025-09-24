'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  User,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Star,
  Briefcase,
  Shield,
  Info,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StandardPage from '@/components/dashboard/templates/StandardPage'

interface ClientFormData {
  name: string
  email: string
  phone?: string
  alternatePhone?: string
  company?: string
  jobTitle?: string
  industry?: string
  businessType: 'individual' | 'sole_proprietorship' | 'partnership' | 'corporation' | 'llc'
  taxId?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country: string
  clientTier: 'individual' | 'smb' | 'enterprise'
  clientSource: 'referral' | 'website' | 'marketing' | 'direct' | 'partner'
  referredBy?: string
  preferredContactMethod: 'email' | 'phone' | 'both'
  preferredMeetingTime?: string
  communicationFrequency: 'weekly' | 'monthly' | 'quarterly' | 'as_needed'
  estimatedAnnualRevenue?: number
  estimatedBudget?: number
  paymentTerms: 'immediate' | 'net_15' | 'net_30' | 'net_60'
  billingAddress?: string
  specialRequirements?: string
  servicesOfInterest: string[]
  urgencyLevel: 'low' | 'normal' | 'high' | 'urgent'
  internalNotes?: string
  tags?: string[]
  assignedAccountManager?: string
  isActive: boolean
  requiresOnboarding: boolean
  gdprConsent: boolean
  marketingOptIn: boolean
}

interface Service { id: string; name: string; category?: string; description?: string; isPopular?: boolean }
interface ValidationError { field: string; message: string }

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const validatePhone = (phone: string) => /^[\+]?([0-9]|\s|\-|\(|\)){5,}$/i.test(phone || '')

async function fetchServices(): Promise<Service[]> {
  try {
    const res = await fetch('/api/services', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch services')
    return await res.json()
  } catch {
    return []
  }
}

async function checkEmailExists(email: string) {
  try {
    const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`, { cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json()
    return !!data.exists
  } catch {
    return false
  }
}

function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function Section({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

export default function ProfessionalAddClientPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    businessType: 'individual',
    clientTier: 'individual',
    clientSource: 'direct',
    preferredContactMethod: 'email',
    communicationFrequency: 'as_needed',
    paymentTerms: 'net_30',
    urgencyLevel: 'normal',
    country: 'EG',
    servicesOfInterest: [],
    isActive: true,
    requiresOnboarding: true,
    gdprConsent: false,
    marketingOptIn: false,
    tags: []
  })

  const steps = useMemo(() => ([
    { number: 1, title: 'Basic Info' },
    { number: 2, title: 'Address' },
    { number: 3, title: 'Classification' },
    { number: 4, title: 'Service Preferences' },
    { number: 5, title: 'Financials' },
    { number: 6, title: 'Additional Details' },
    { number: 7, title: 'Review & Confirm' }
  ]), [])

  useEffect(() => {
    const load = async () => {
      setDataLoading(true)
      const svc = await fetchServices()
      setServices(svc)
      setDataLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!formData.email || !validateEmail(formData.email)) {
      setEmailExists(false)
      return
    }
    const t = setTimeout(async () => {
      setEmailChecking(true)
      const exists = await checkEmailExists(formData.email)
      setEmailExists(exists)
      setEmailChecking(false)
    }, 500)
    return () => clearTimeout(t)
  }, [formData.email])

  const setField = <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => {
    setFormData((p) => ({ ...p, [field]: value }))
    setValidationErrors((prev) => prev.filter((e) => e.field !== field))
    setError(null)
  }

  const fieldError = (f: string) => validationErrors.find((e) => e.field === f)?.message

  const validateStep = (step = currentStep) => {
    const errs: ValidationError[] = []
    if (step === 1) {
      if (!formData.name.trim()) errs.push({ field: 'name', message: 'Full name is required' })
      if (!formData.email.trim()) errs.push({ field: 'email', message: 'Email is required' })
      else if (!validateEmail(formData.email)) errs.push({ field: 'email', message: 'Enter a valid email' })
      else if (emailExists) errs.push({ field: 'email', message: 'Email already exists' })
      if (formData.phone && !validatePhone(formData.phone)) errs.push({ field: 'phone', message: 'Invalid phone number' })
      if (formData.taxId && formData.taxId.length < 5) errs.push({ field: 'taxId', message: 'Tax ID looks invalid' })
    } else if (step === 2) {
      if (!formData.country) errs.push({ field: 'country', message: 'Country is required' })
    } else if (step === 7) {
      if (!formData.gdprConsent) errs.push({ field: 'gdprConsent', message: 'GDPR consent is required' })
    }
    setValidationErrors(errs)
    return errs.length === 0
  }

  const goNext = () => {
    if (!validateStep()) return
    setCurrentStep((s) => Math.min(steps.length, s + 1))
  }
  const goBack = () => setCurrentStep((s) => Math.max(1, s - 1))

  const handleSubmit = async () => {
    if (!validateStep(7)) return
    setLoading(true)
    setError(null)
    try {
      const password = generateTempPassword()
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create client')
      }
      setTempPassword(password)
      setSuccess('Client account created successfully!')
      setTimeout(() => { window.location.href = '/admin/users' }, 3000)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create client account'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const servicesByCategory = useMemo(() => {
    return services.reduce<Record<string, Service[]>>((acc, s) => {
      const k = s.category || 'General'
      if (!acc[k]) acc[k] = []
      acc[k].push(s)
      return acc
    }, {})
  }, [services])

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-green-200">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Created Successfully</h2>
            {tempPassword && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm mb-4">
                Temporary password: <span className="font-mono font-semibold">{tempPassword}</span>
              </div>
            )}
            <p className="text-gray-600">Redirecting to client management...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <StandardPage
      title="Add New Client"
      subtitle="Create a client account and capture onboarding details"
      secondaryActions={[{ label: 'Back', onClick: () => (window.location.href = '/admin/users') }]}
    >
      <div className="max-w-5xl mx-auto p-0 space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Admin Only</Badge>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {steps.map((s) => (
                <div key={s.number} className={`flex flex-col items-center text-xs ${currentStep === s.number ? 'text-blue-600' : 'text-gray-500'}`}>
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full border ${currentStep >= s.number ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300'}`}>
                    {s.number}
                  </div>
                  <div className="mt-1 truncate max-w-[90px]">{s.title}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
        )}

        {dataLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading form data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentStep === 1 && (
              <Section icon={User} title="Basic Information" description="Client details and primary contacts">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setField('name', e.target.value)} className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldError('name') ? 'border-red-300' : 'border-gray-300'}`} placeholder="Client full name" />
                    {fieldError('name') && <p className="text-red-600 text-xs mt-1">{fieldError('name')}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <div className="relative">
                      <input type="email" value={formData.email} onChange={(e) => setField('email', e.target.value)} className={`w-full border rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldError('email') || emailExists ? 'border-red-300' : 'border-gray-300'}`} placeholder="client@example.com" />
                      {emailChecking && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />}
                      {emailExists && !emailChecking && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />}
                    </div>
                    {(fieldError('email') || emailExists) && (
                      <p className="text-red-600 text-xs mt-1">{emailExists ? 'Email address already exists' : fieldError('email')}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                    <input type="tel" value={formData.phone || ''} onChange={(e) => setField('phone', e.target.value)} className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldError('phone') ? 'border-red-300' : 'border-gray-300'}`} placeholder="+20123456789" />
                    {fieldError('phone') && <p className="text-red-600 text-xs mt-1">{fieldError('phone')}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                    <input type="tel" value={formData.alternatePhone || ''} onChange={(e) => setField('alternatePhone', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Secondary contact" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company/Organization</label>
                    <input type="text" value={formData.company || ''} onChange={(e) => setField('company', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Company name (optional)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input type="text" value={formData.jobTitle || ''} onChange={(e) => setField('jobTitle', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Position or title" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                    <select value={formData.businessType} onChange={(e) => setField('businessType', e.target.value as ClientFormData['businessType'])} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="individual">Individual</option>
                      <option value="sole_proprietorship">Sole Proprietorship</option>
                      <option value="partnership">Partnership</option>
                      <option value="corporation">Corporation</option>
                      <option value="llc">LLC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select value={formData.industry || ''} onChange={(e) => setField('industry', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select Industry</option>
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="finance">Finance</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="real_estate">Real Estate</option>
                      <option value="construction">Construction</option>
                      <option value="professional_services">Professional Services</option>
                      <option value="education">Education</option>
                      <option value="hospitality">Hospitality</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / SSN / EIN</label>
                  <input type="text" value={formData.taxId || ''} onChange={(e) => setField('taxId', e.target.value)} className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldError('taxId') ? 'border-red-300' : 'border-gray-300'}`} placeholder={formData.businessType === 'individual' ? 'XXX-XX-XXXX (SSN)' : 'XX-XXXXXXX (EIN)'} />
                  {fieldError('taxId') && <p className="text-red-600 text-xs mt-1">{fieldError('taxId')}</p>}
                  <p className="text-xs text-gray-500 mt-1">Sensitive information is protected and used only for tax purposes</p>
                </div>
              </Section>
            )}

            {currentStep === 2 && (
              <Section icon={MapPin} title="Address Information" description="Physical address for billing and correspondence">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input type="text" value={formData.address || ''} onChange={(e) => setField('address', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Street address, building, apartment" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" value={formData.city || ''} onChange={(e) => setField('city', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input type="text" value={formData.state || ''} onChange={(e) => setField('state', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="State or Province" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input type="text" value={formData.postalCode || ''} onChange={(e) => setField('postalCode', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ZIP/Postal Code" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select value={formData.country} onChange={(e) => setField('country', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="EG">Egypt</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="AE">UAE</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </Section>
            )}

            {currentStep === 3 && (
              <Section icon={Star} title="Client Classification" description="Tier and source for pricing and prioritization">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Tier</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'individual', label: 'Individual', desc: 'Personal services' },
                      { value: 'smb', label: 'SMB', desc: 'Business accounting' },
                      { value: 'enterprise', label: 'Enterprise', desc: 'Corporate services' }
                    ].map((t) => (
                      <div key={t.value} onClick={() => setField('clientTier', t.value as ClientFormData['clientTier'])} className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${formData.clientTier === t.value ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="font-medium text-sm mb-1">{t.label}</div>
                        <div className="text-xs text-gray-600">{t.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Source</label>
                    <select value={formData.clientSource} onChange={(e) => setField('clientSource', e.target.value as ClientFormData['clientSource'])} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="referral">Referral</option>
                      <option value="website">Website</option>
                      <option value="marketing">Marketing</option>
                      <option value="direct">Direct</option>
                      <option value="partner">Partner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                    <select value={formData.urgencyLevel} onChange={(e) => setField('urgencyLevel', e.target.value as ClientFormData['urgencyLevel'])} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                {formData.clientSource === 'referral' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referred By</label>
                    <input type="text" value={formData.referredBy || ''} onChange={(e) => setField('referredBy', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Referrer name" />
                  </div>
                )}
              </Section>
            )}

            {currentStep === 4 && (
              <Section icon={Briefcase} title="Service Preferences" description="Communication preferences and services of interest">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact Method</label>
                    <select value={formData.preferredContactMethod} onChange={(e) => setField('preferredContactMethod', e.target.value as ClientFormData['preferredContactMethod'])} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Communication Frequency</label>
                    <select value={formData.communicationFrequency} onChange={(e) => setField('communicationFrequency', e.target.value as ClientFormData['communicationFrequency'])} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="as_needed">As Needed</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Services of Interest</label>
                  <div className="space-y-4">
                    {Object.entries(servicesByCategory).map(([category, items]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-800">{category}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {items.map((service) => (
                            <label key={service.id} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                              <input type="checkbox" checked={formData.servicesOfInterest.includes(service.id)} onChange={() => {
                                const cur = formData.servicesOfInterest
                                const upd = cur.includes(service.id) ? cur.filter((id) => id !== service.id) : [...cur, service.id]
                                setField('servicesOfInterest', upd)
                              }} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                  {service.name}
                                  {service.isPopular && <Star className="h-3 w-3 text-yellow-500" />}
                                </div>
                                {service.description && <div className="text-xs text-gray-600 whitespace-normal break-words">{service.description}</div>}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {currentStep === 5 && (
              <Section icon={DollarSign} title="Financial Information" description="Budget and payment preferences">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Annual Revenue</label>
                    <input type="number" value={formData.estimatedAnnualRevenue || ''} onChange={(e) => setField('estimatedAnnualRevenue', e.target.value ? parseFloat(e.target.value) : undefined)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Annual business revenue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Service Budget</label>
                    <input type="number" value={formData.estimatedBudget || ''} onChange={(e) => setField('estimatedBudget', e.target.value ? parseFloat(e.target.value) : undefined)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Annual service budget" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <select value={formData.paymentTerms} onChange={(e) => setField('paymentTerms', e.target.value as ClientFormData['paymentTerms'])} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="immediate">Immediate</option>
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_60">Net 60</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address (optional)</label>
                  <textarea rows={2} value={formData.billingAddress || ''} onChange={(e) => setField('billingAddress', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="If different from physical address" />
                </div>
              </Section>
            )}

            {currentStep === 6 && (
              <Section icon={Shield} title="Additional Details" description="Notes, tags, onboarding and compliance">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                    <textarea rows={4} value={formData.internalNotes || ''} onChange={(e) => setField('internalNotes', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Staff-only notes" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                    <textarea rows={4} value={formData.specialRequirements || ''} onChange={(e) => setField('specialRequirements', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Any specific needs" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags?.map((t, i) => (
                      <span key={`${t}-${i}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-full">
                        {t}
                        <button aria-label={`Remove ${t}`} onClick={() => setField('tags', (formData.tags || []).filter((x) => x !== t))} className="text-gray-500 hover:text-red-600">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Add tag" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = (e.target as HTMLInputElement).value.trim()
                        if (val && !(formData.tags || []).includes(val)) setField('tags', [ ...(formData.tags || []), val ])
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }} />
                    <Button type="button" onClick={() => {
                      const input = document.querySelector<HTMLInputElement>('input[placeholder=\\"Add tag\\"]')
                      if (input) {
                        const val = input.value.trim()
                        if (val && !(formData.tags || []).includes(val)) setField('tags', [ ...(formData.tags || []), val ])
                        input.value = ''
                      }
                    }}>Add</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input id="isActive" type="checkbox" checked={formData.isActive} onChange={(e) => setField('isActive', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="isActive" className="text-sm">Active</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="requiresOnboarding" type="checkbox" checked={formData.requiresOnboarding} onChange={(e) => setField('requiresOnboarding', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="requiresOnboarding" className="text-sm">Requires Onboarding</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="marketingOptIn" type="checkbox" checked={formData.marketingOptIn} onChange={(e) => setField('marketingOptIn', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="marketingOptIn" className="text-sm">Marketing Opt-in</label>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input id="gdprConsent" type="checkbox" checked={formData.gdprConsent} onChange={(e) => setField('gdprConsent', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="gdprConsent" className="text-sm">I confirm GDPR consent for storing client data</label>
                </div>
                {fieldError('gdprConsent') && <p className="text-red-600 text-xs mt-1">{fieldError('gdprConsent')}</p>}
              </Section>
            )}

            {currentStep === 7 && (
              <Section icon={Info} title="Review & Confirm" description="Verify details before account creation">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Basic Information</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-gray-600">Name:</span><span className="font-medium">{formData.name || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Email:</span><span>{formData.email || '—'}</span></div>
                      {formData.phone && <div className="flex justify-between"><span className="text-gray-600">Phone:</span><span>{formData.phone}</span></div>}
                      {formData.company && <div className="flex justify-between"><span className="text-gray-600">Company:</span><span>{formData.company}</span></div>}
                      <div className="flex justify-between"><span className="text-gray-600">Business Type:</span><span className="capitalize">{formData.businessType.replace('_', ' ')}</span></div>
                    </div>
                    <h3 className="font-medium text-gray-900 pt-2">Address</h3>
                    <div className="text-sm space-y-1">
                      {formData.address && <div className="flex justify-between"><span className="text-gray-600">Address:</span><span className="truncate max-w-[240px] text-right">{formData.address}</span></div>}
                      <div className="flex justify-between"><span className="text-gray-600">City:</span><span>{formData.city || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">State:</span><span>{formData.state || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Postal Code:</span><span>{formData.postalCode || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Country:</span><span>{formData.country || '—'}</span></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Classification</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-gray-600">Tier:</span><Badge variant="outline">{formData.clientTier.toUpperCase()}</Badge></div>
                      <div className="flex justify-between"><span className="text-gray-600">Source:</span><span className="capitalize">{formData.clientSource.replace('_', ' ')}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Urgency:</span><span className="capitalize">{formData.urgencyLevel}</span></div>
                    </div>
                    {formData.servicesOfInterest.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 pt-2">Services of Interest</h3>
                        <div className="text-sm space-y-1">
                          {formData.servicesOfInterest.map((id) => {
                            const svc = services.find((s) => s.id === id)
                            if (!svc) return null
                            return (
                              <div key={id} className="flex justify-between"><span>{svc.name}</span><Badge variant="outline" className="text-xs">{svc.category || 'General'}</Badge></div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <h3 className="font-medium text-gray-900 pt-2">Account Status</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-gray-600">Active:</span><Badge variant={formData.isActive ? 'default' : 'secondary'}>{formData.isActive ? 'Yes' : 'No'}</Badge></div>
                      <div className="flex justify-between"><span className="text-gray-600">Onboarding:</span><Badge variant={formData.requiresOnboarding ? 'default' : 'secondary'}>{formData.requiresOnboarding ? 'Yes' : 'No'}</Badge></div>
                      <div className="flex justify-between"><span className="text-gray-600">GDPR Consent:</span><Badge variant={formData.gdprConsent ? 'default' : 'destructive'}>{formData.gdprConsent ? 'Given' : 'Required'}</Badge></div>
                    </div>
                  </div>
                </div>
              </Section>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={goBack} disabled={currentStep === 1}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
              {currentStep < steps.length ? (
                <Button onClick={goNext} disabled={emailChecking}><ArrowRight className="h-4 w-4 mr-1" />Next</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || emailChecking}>{loading ? (<span className="inline-flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Creating...</span>) : 'Create Client'}</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </StandardPage>
  )
}
