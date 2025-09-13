'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Clock,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  Building,
  Globe,
  CalendarDays,
  Timer,
  Save,
  Send,
  Eye,
  Star,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

// Data types
interface Service {
  id: string
  name: string
  description: string
  category: 'tax' | 'audit' | 'consulting' | 'bookkeeping' | 'advisory'
  duration: number
  price: number
  estimatedHours: number
  requirements: string[]
  isPopular: boolean
  complexity: 'basic' | 'intermediate' | 'advanced'
}

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  tier: 'individual' | 'smb' | 'enterprise'
  address?: string
  totalBookings: number
  lastBooking?: string
  preferredTime?: string
  notes?: string
  isActive: boolean
}

interface Staff {
  id: string
  name: string
  role: string
  email: string
  avatar?: string
  specialties: string[]
  isAvailable: boolean
  workingHours: { start: string; end: string; days: string[] }
  department?: 'tax' | 'audit' | 'consulting' | 'bookkeeping' | 'advisory' | 'admin'
}

interface BookingFormData {
  // Client Information
  clientId?: string
  isNewClient: boolean
  clientName: string
  clientEmail: string
  clientPhone: string
  clientCompany?: string
  clientType: 'individual' | 'smb' | 'enterprise'
  clientAddress?: string

  // Service Details
  serviceId: string
  serviceName: string
  customRequirements?: string
  estimatedComplexity: 'basic' | 'intermediate' | 'advanced'

  // Scheduling
  scheduledDate: string
  scheduledTime: string
  duration: number
  timezone: string

  // Assignment
  assignedStaffId?: string
  assignedStaffName?: string

  // Location & Logistics
  location: 'office' | 'remote' | 'client_site'
  meetingLink?: string
  onSiteAddress?: string
  specialInstructions?: string

  // Business Details
  priority: 'normal' | 'high' | 'urgent'
  isRecurring: boolean
  recurringPattern?: 'weekly' | 'monthly' | 'quarterly'
  source: 'website' | 'referral' | 'direct' | 'marketing'
  expectedRevenue: number

  // Notes & Follow-up
  internalNotes?: string
  clientNotes?: string
  requiresPreparation: boolean
  preparationNotes?: string
  followUpRequired: boolean
}

// Mock data (replace with API integration when available)
const mockServices: Service[] = [
  {
    id: 's1',
    name: 'Individual Tax Consultation',
    description: 'Personal tax planning and filing assistance',
    category: 'tax',
    duration: 60,
    price: 150,
    estimatedHours: 1,
    requirements: ['Previous year tax returns', 'Income statements', 'Expense receipts'],
    isPopular: true,
    complexity: 'basic'
  },
  {
    id: 's2',
    name: 'Corporate Tax Planning',
    description: 'Strategic tax planning for businesses',
    category: 'tax',
    duration: 120,
    price: 350,
    estimatedHours: 2,
    requirements: ['Financial statements', 'Previous tax filings', 'Business records'],
    isPopular: true,
    complexity: 'advanced'
  },
  {
    id: 's3',
    name: 'Quarterly Business Review',
    description: 'Comprehensive quarterly financial analysis',
    category: 'audit',
    duration: 180,
    price: 500,
    estimatedHours: 3,
    requirements: ['Quarterly statements', 'Bank statements', 'Transaction records'],
    isPopular: false,
    complexity: 'advanced'
  },
  {
    id: 's4',
    name: 'Bookkeeping Setup',
    description: 'Initial bookkeeping system setup and training',
    category: 'bookkeeping',
    duration: 90,
    price: 200,
    estimatedHours: 1.5,
    requirements: ['Business registration', 'Bank account details', 'Transaction history'],
    isPopular: true,
    complexity: 'intermediate'
  }
]

const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com',
    phone: '+20123456789',
    company: 'Hassan Trading Co.',
    tier: 'smb',
    totalBookings: 8,
    lastBooking: '2025-08-15',
    preferredTime: '10:00',
    isActive: true
  },
  {
    id: 'c2',
    name: 'Sarah Mohamed',
    email: 'sarah.mohamed@company.com',
    phone: '+20987654321',
    company: 'Tech Solutions Ltd.',
    tier: 'enterprise',
    totalBookings: 15,
    lastBooking: '2025-09-01',
    preferredTime: '14:00',
    isActive: true
  },
  {
    id: 'c3',
    name: 'Mohamed Ali',
    email: 'mohamed.ali@gmail.com',
    phone: '+20555666777',
    tier: 'individual',
    totalBookings: 3,
    lastBooking: '2025-07-20',
    isActive: true
  }
]

const mockStaff: Staff[] = [
  {
    id: 'st1',
    name: 'John Smith',
    role: 'Senior Tax Advisor',
    email: 'john.smith@firm.com',
    specialties: ['Corporate Tax', 'International Tax', 'Tax Planning'],
    isAvailable: true,
    workingHours: { start: '09:00', end: '17:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
  },
  {
    id: 'st2',
    name: 'Jane Doe',
    role: 'Audit Manager',
    email: 'jane.doe@firm.com',
    specialties: ['Financial Audit', 'Compliance Review', 'Risk Assessment'],
    isAvailable: true,
    workingHours: { start: '08:30', end: '16:30', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
  },
  {
    id: 'st3',
    name: 'Robert Johnson',
    role: 'Business Consultant',
    email: 'robert.johnson@firm.com',
    specialties: ['Business Strategy', 'Financial Planning', 'Growth Advisory'],
    isAvailable: false,
    workingHours: { start: '10:00', end: '18:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
  }
]

const generateTimeSlots = (startHour = 8, endHour = 18): string[] => {
  const slots: string[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(time)
    }
  }
  return slots
}

const timeSlots = generateTimeSlots()

function ClientSelector({
  clients,
  selectedClient,
  onClientSelect,
  isNewClient,
  onNewClientToggle,
  searchTerm,
  onSearchChange
}: {
  clients: Client[]
  selectedClient?: Client
  onClientSelect: (client: Client) => void
  isNewClient: boolean
  onNewClientToggle: (isNew: boolean) => void
  searchTerm: string
  onSearchChange: (term: string) => void
}) {
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Client Selection</CardTitle>
            <CardDescription>Choose existing client or create new</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={!isNewClient ? 'default' : 'outline'}
              size="sm"
              onClick={() => onNewClientToggle(false)}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Existing
            </Button>
            <Button asChild variant={isNewClient ? 'default' : 'outline'} size="sm" className="gap-2">
              <Link href="/admin/clients/new">
                <Plus className="h-4 w-4" />
                New Client
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isNewClient ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => onClientSelect(client)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedClient?.id === client.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{client.name}</h3>
                        <Badge
                          variant={
                            client.tier === 'enterprise' ? 'default' : client.tier === 'smb' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {client.tier.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.company && (
                          <div className="flex items-center gap-2">
                            <Building className="h-3 w-3" />
                            <span>{client.company}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{client.totalBookings} bookings</div>
                      {client.lastBooking && <div>Last: {new Date(client.lastBooking).toLocaleDateString()}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No clients found matching your search</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <UserIcon className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h3 className="font-medium text-gray-900 mb-2">New Client</h3>
            <p className="text-sm text-gray-600">Fill client details in the form below</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ServiceSelector({
  services,
  selectedService,
  onServiceSelect,
  categoryFilter,
  onCategoryFilterChange
}: {
  services: Service[]
  selectedService?: Service
  onServiceSelect: (service: Service) => void
  categoryFilter: string
  onCategoryFilterChange: (category: string) => void
}) {
  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))]
  const filteredServices = categoryFilter === 'all' ? services : services.filter((s) => s.category === categoryFilter)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tax':
        return 'bg-green-100 text-green-800'
      case 'audit':
        return 'bg-blue-100 text-blue-800'
      case 'consulting':
        return 'bg-purple-100 text-purple-800'
      case 'bookkeeping':
        return 'bg-orange-100 text-orange-800'
      case 'advisory':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Service Selection</CardTitle>
            <CardDescription>Choose the service for this appointment</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              onClick={() => onServiceSelect(service)}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedService?.id === service.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{service.name}</h3>
                  {service.isPopular && (
                    <Badge variant="default" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
                <Badge className={`text-xs ${getCategoryColor(service.category)}`}>{service.category}</Badge>
              </div>

              <p className="text-sm text-gray-600 mb-3">{(service.description || '').length > 120 ? `${service.description.slice(0, 120)}…` : (service.description || '')}</p>

              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{service.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>${service.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-gray-400" />
                  <span>{service.estimatedHours}h est.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {service.complexity}
                  </Badge>
                </div>
              </div>

              {service.requirements.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Required Documents:</p>
                  <div className="space-y-1">
                    {service.requirements.slice(0, 2).map((req, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{req}</span>
                      </div>
                    ))}
                    {service.requirements.length > 2 && (
                      <div className="text-xs text-gray-500">+{service.requirements.length - 2} more requirements</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SchedulingSection({
  selectedDate,
  selectedTime,
  duration,
  onDateChange,
  onTimeChange,
  assignedStaff,
  onStaffChange,
  staff,
  location,
  onLocationChange
}: {
  selectedDate: string
  selectedTime: string
  duration: number
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  assignedStaff?: Staff
  onStaffChange: (staff: Staff) => void
  staff: Staff[]
  location: 'office' | 'remote' | 'client_site'
  onLocationChange: (location: 'office' | 'remote' | 'client_site') => void
}) {
  const availableStaff = staff.filter((s) => s.isAvailable)

  const generateDateOptions = () => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Scheduling & Assignment</CardTitle>
        <CardDescription>Set appointment time and assign team member</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarDays className="h-4 w-4 inline mr-1" />
              Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Date</option>
              {generateDateOptions().map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Time ({duration} minutes)
            </label>
            <select
              value={selectedTime}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <UserIcon className="h-4 w-4 inline mr-1" />
            Assign Team Member
          </label>
          <div className="space-y-2">
            {availableStaff.map((member) => (
              <div
                key={member.id}
                onClick={() => onStaffChange(member)}
                className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                  assignedStaff?.id === member.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{member.email}</span>
                    </div>
                    <div className="mt-1">
                      {member.specialties.slice(0, 2).map((specialty, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs mr-1 mb-1">
                          {specialty}
                        </Badge>
                      ))}
                      {member.specialties.length > 2 && (
                        <span className="text-xs text-gray-500">+{member.specialties.length - 2} more</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Available
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {member.workingHours.start} - {member.workingHours.end}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Location</label>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { value: 'office', label: 'Office Visit', icon: Building },
                { value: 'remote', label: 'Remote/Video', icon: Globe },
                { value: 'client_site', label: 'Client Site', icon: MapPin }
              ] as { value: 'office' | 'remote' | 'client_site'; label: string; icon: typeof Building }[]
            ).map((option) => {
              const IconComponent = option.icon
              return (
                <div
                  key={option.value}
                  onClick={() => onLocationChange(option.value)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all text-center ${
                    location === option.value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProfessionalNewBooking() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    isNewClient: false,
    clientType: 'individual',
    location: 'office',
    priority: 'normal',
    isRecurring: false,
    source: 'direct',
    timezone: 'Africa/Cairo',
    requiresPreparation: false,
    followUpRequired: false
  })

  const [services, setServices] = useState<Service[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [team, setTeam] = useState<Staff[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true)
        const svcRes = await apiFetch('/api/services', { cache: 'no-store' })
        const svcJson = (await svcRes.json().catch(() => [])) as unknown
        type ApiService = {
          id: string
          name: string
          description?: string | null
          shortDesc?: string | null
          category?: string | null
          duration?: number | null
          price?: number | null
          features?: string[] | null
          featured?: boolean | null
        }
        const mappedServices: Service[] = (Array.isArray(svcJson) ? (svcJson as ApiService[]) : []).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || s.shortDesc || '',
          category: (s.category || 'consulting').toLowerCase() as Service['category'],
          duration: s.duration || 60,
          price: s.price || 0,
          estimatedHours: Math.max(1, Math.round(((s.duration || 60) / 60) * 10) / 10),
          requirements: Array.isArray(s.features) && s.features.length ? s.features.slice(0, 5) : ['Government ID', 'Previous statements'],
          isPopular: !!s.featured,
          complexity: (s.duration || 60) > 120 ? 'advanced' : (s.duration || 60) > 60 ? 'intermediate' : 'basic'
        }))
        setServices(mappedServices.length ? mappedServices : mockServices)

        const uRes = await apiFetch('/api/admin/users', { cache: 'no-store' })
        const uJson = (await uRes.json().catch(() => ({ users: [] }))) as unknown
        type ApiUser = { id: string; name?: string | null; email: string; role?: string | null }
        const usersUnknown = (uJson && typeof uJson === 'object' && 'users' in (uJson as Record<string, unknown>)
          ? ((uJson as { users?: unknown }).users as unknown)
          : []) as unknown
        const users = Array.isArray(usersUnknown) ? (usersUnknown as ApiUser[]) : []
        const mappedClients: Client[] = users
          .filter((u) => u.role === 'CLIENT')
          .map((u) => ({
            id: u.id,
            name: u.name || u.email,
            email: u.email,
            phone: '',
            tier: 'individual',
            totalBookings: 0,
            isActive: true
          }))
        setClients(mappedClients)

        // Load team members for assignment
        try {
          const tmRes = await fetch('/api/admin/team-members', { cache: 'no-store' })
          type ApiTeamMember = { id: string; name: string; email: string; title?: string; role?: string; specialties?: string[]; isAvailable?: boolean; status?: string; workingHours?: { start?: string; end?: string; days?: string[] }; department?: Staff['department'] }
          const tmJson = (await tmRes.json().catch(() => ({ teamMembers: [] }))) as { teamMembers?: ApiTeamMember[] }
          const members = Array.isArray(tmJson.teamMembers) ? tmJson.teamMembers : []
          const mappedTeam: Staff[] = members.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.title || m.role || 'Staff',
            email: m.email,
            specialties: Array.isArray(m.specialties) ? m.specialties : [],
            isAvailable: Boolean(m.isAvailable && m.status === 'active'),
            workingHours: { start: m.workingHours?.start || '09:00', end: m.workingHours?.end || '17:00', days: m.workingHours?.days || ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
            department: m.department
          }))
          setTeam(mappedTeam.length ? mappedTeam : mockStaff)
        } catch {
          setTeam(mockStaff)
        }
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  const [selectedClient, setSelectedClient] = useState<Client>()
  const [selectedService, setSelectedService] = useState<Service>()
  const [assignedStaff, setAssignedStaff] = useState<Staff>()
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [serviceCategory, setServiceCategory] = useState('all')
  const [showPreview, setShowPreview] = useState(false)
  const stepAnchorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    stepAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentStep])

  const steps = [
    { number: 1, title: 'Client', description: 'Select or create client' },
    { number: 2, title: 'Service', description: 'Choose service type' },
    { number: 3, title: 'Schedule', description: 'Set date and assign staff' },
    { number: 4, title: 'Details', description: 'Additional information' },
    { number: 5, title: 'Review', description: 'Confirm booking details' }
  ]

  const handleFormChange = <K extends keyof BookingFormData>(field: K, value: BookingFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setFormData((prev) => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone || '',
      clientCompany: client.company,
      clientType: client.tier,
      isNewClient: false
    }))
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setFormData((prev) => ({
      ...prev,
      serviceId: service.id,
      serviceName: service.name,
      duration: service.duration,
      expectedRevenue: service.price,
      estimatedComplexity: service.complexity
    }))
  }

  const handleStaffSelect = (staff: Staff) => {
    setAssignedStaff(staff)
    setFormData((prev) => ({ ...prev, assignedStaffId: staff.id, assignedStaffName: staff.name }))
  }

  const canProceedToNext = () => {
    const step1Valid = formData.isNewClient ? Boolean(formData.clientName && formData.clientEmail) : Boolean(selectedClient)
    const step2Valid = Boolean(selectedService)
    const step3Valid = Boolean(formData.scheduledDate && formData.scheduledTime && assignedStaff)

    switch (currentStep) {
      case 1:
        return step1Valid
      case 2:
        return step2Valid
      case 3:
        return step3Valid
      case 4:
        return true
      case 5:
        return step1Valid && step2Valid && step3Valid
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (!formData.serviceId || !formData.scheduledDate || !formData.scheduledTime || !formData.clientName || !formData.clientEmail) {
        alert('Please complete required fields before submitting.')
        return
      }
      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`)
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.clientId,
          serviceId: formData.serviceId,
          scheduledAt: scheduledAt.toISOString(),
          notes: [formData.internalNotes, formData.clientNotes, (assignedStaff ? `Assigned to: ${assignedStaff.name} (${assignedStaff.id})` : '')].filter(Boolean).join('\n'),
          assignedTeamMemberId: assignedStaff?.id,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create booking')
      }
      const booking = await res.json()
      const bookingId = booking?.id
      if (bookingId) {
        router.push(`/admin/bookings/${bookingId}`)
        return
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <ClientSelector
              clients={clients.length ? clients : mockClients}
              selectedClient={selectedClient}
              onClientSelect={handleClientSelect}
              isNewClient={formData.isNewClient || false}
              onNewClientToggle={(isNew) => handleFormChange('isNewClient', isNew)}
              searchTerm={clientSearchTerm}
              onSearchChange={setClientSearchTerm}
            />

            {formData.isNewClient && (
              <Card>
                <CardHeader>
                  <CardTitle>Create Client in Full Form</CardTitle>
                  <CardDescription>Use the dedicated client creation page for complete details</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/admin/clients/new">Open Client Creation</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 2:
        return (
          <ServiceSelector
            services={services}
            selectedService={selectedService}
            onServiceSelect={handleServiceSelect}
            categoryFilter={serviceCategory}
            onCategoryFilterChange={setServiceCategory}
          />
        )

      case 3:
        return (
          <SchedulingSection
            selectedDate={formData.scheduledDate || ''}
            selectedTime={formData.scheduledTime || ''}
            duration={formData.duration || 60}
            onDateChange={(date) => handleFormChange('scheduledDate', date)}
            onTimeChange={(time) => handleFormChange('scheduledTime', time)}
            assignedStaff={assignedStaff}
            onStaffChange={handleStaffSelect}
            staff={(selectedService ? team.filter((s) => !s.department || s.department === selectedService.category) : team).filter((s) => s.isAvailable)}
            location={formData.location || 'office'}
            onLocationChange={(location) => handleFormChange('location', location)}
          />
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Details</CardTitle>
              <CardDescription>Optional information and special requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleFormChange('priority', e.target.value as BookingFormData['priority'])}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booking Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleFormChange('source', e.target.value as BookingFormData['source'])}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="direct">Direct Contact</option>
                    <option value="website">Website Form</option>
                    <option value="referral">Client Referral</option>
                    <option value="marketing">Marketing Campaign</option>
                  </select>
                </div>
              </div>

              {formData.location === 'remote' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link (Optional)</label>
                  <input
                    type="url"
                    value={formData.meetingLink || ''}
                    onChange={(e) => handleFormChange('meetingLink', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}

              {formData.location === 'client_site' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Site Address</label>
                  <textarea
                    value={formData.onSiteAddress || ''}
                    onChange={(e) => handleFormChange('onSiteAddress', e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Client's site address"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                <textarea
                  value={formData.specialInstructions || ''}
                  onChange={(e) => handleFormChange('specialInstructions', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or instructions for this appointment..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={!!formData.isRecurring}
                    onChange={(e) => handleFormChange('isRecurring', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                    This is a recurring appointment
                  </label>
                </div>

                {formData.isRecurring && (
                  <div className="ml-6">
                    <select
                      value={formData.recurringPattern}
                      onChange={(e) => handleFormChange('recurringPattern', e.target.value as BookingFormData['recurringPattern'])}
                      className="w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Pattern</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="preparation"
                    checked={!!formData.requiresPreparation}
                    onChange={(e) => handleFormChange('requiresPreparation', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="preparation" className="text-sm font-medium text-gray-700">
                    Requires preparation/document review
                  </label>
                </div>

                {formData.requiresPreparation && (
                  <div className="ml-6">
                    <textarea
                      value={formData.preparationNotes || ''}
                      onChange={(e) => handleFormChange('preparationNotes', e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe what preparation is needed..."
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes</label>
                  <textarea
                    value={formData.internalNotes || ''}
                    onChange={(e) => handleFormChange('internalNotes', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Internal notes (not visible to client)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes for Client</label>
                  <textarea
                    value={formData.clientNotes || ''}
                    onChange={(e) => handleFormChange('clientNotes', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Notes that will be shared with the client"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Review Booking Details</CardTitle>
                  <CardDescription>Please verify all information before confirming</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-2">
                  <Eye className="h-4 w-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <h3 className="font-medium text-gray-900 mb-2">Client Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Name:</span><span className="font-medium">{formData.clientName}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Email:</span><span>{formData.clientEmail}</span></div>
                      {formData.clientPhone && <div className="flex justify-between"><span className="text-gray-600">Phone:</span><span>{formData.clientPhone}</span></div>}
                      {formData.clientCompany && <div className="flex justify-between"><span className="text-gray-600">Company:</span><span>{formData.clientCompany}</span></div>}
                      <div className="flex justify-between"><span className="text-gray-600">Type:</span><Badge variant="outline" className="text-xs">{formData.clientType?.toUpperCase()}</Badge></div>
                    </div>
                  </div>

                  <div className="border-b pb-3">
                    <h3 className="font-medium text-gray-900 mb-2">Service Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Service:</span><span className="font-medium">{selectedService?.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Category:</span><Badge variant="secondary" className="text-xs">{selectedService?.category}</Badge></div>
                      <div className="flex justify-between"><span className="text-gray-600">Duration:</span><span>{formData.duration} minutes</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Expected Fee:</span><span className="font-medium text-green-600">${formData.expectedRevenue}</span></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Additional Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <Badge
                          variant={formData.priority === 'urgent' ? 'destructive' : formData.priority === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {formData.priority?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between"><span className="text-gray-600">Source:</span><span>{formData.source?.replace('_', ' ')}</span></div>
                      {formData.isRecurring && <div className="flex justify-between"><span className="text-gray-600">Recurring:</span><span>{formData.recurringPattern}</span></div>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <h3 className="font-medium text-gray-900 mb-2">Scheduling</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Date:</span><span className="font-medium">{formData.scheduledDate && new Date(formData.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Time:</span><span className="font-medium">{formData.scheduledTime && new Date(`2000-01-01T${formData.scheduledTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Assigned To:</span><span className="font-medium">{assignedStaff?.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Location:</span><Badge variant="outline" className="text-xs">{formData.location?.replace('_', ' ')}</Badge></div>
                    </div>
                  </div>

                  {(formData.specialInstructions || formData.internalNotes || formData.clientNotes) && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                      <div className="space-y-3 text-sm">
                        {formData.specialInstructions && (
                          <div>
                            <span className="text-gray-600 block mb-1">Special Instructions:</span>
                            <p className="bg-gray-50 p-2 rounded text-xs">{formData.specialInstructions}</p>
                          </div>
                        )}
                        {formData.internalNotes && (
                          <div>
                            <span className="text-gray-600 block mb-1">Internal Notes:</span>
                            <p className="bg-yellow-50 p-2 rounded text-xs">{formData.internalNotes}</p>
                          </div>
                        )}
                        {formData.clientNotes && (
                          <div>
                            <span className="text-gray-600 block mb-1">Client Notes:</span>
                            <p className="bg-blue-50 p-2 rounded text-xs">{formData.clientNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {showPreview && selectedService && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Service Requirements</h4>
                  <div className="space-y-2">
                    {selectedService.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">New Booking</h1>
          <p className="text-gray-600">Schedule a new client appointment</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      currentStep === step.number
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : currentStep > step.number
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? <CheckCircle className="h-5 w-5" /> : <span className="font-medium">{step.number}</span>}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div ref={stepAnchorRef}></div>

        <div className="mb-8">{loadingData ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading booking data...</p>
          </div>
        ) : (
          renderStepContent()
        )}</div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                {currentStep < 5 ? (
                  <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceedToNext()} className="gap-2">
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !canProceedToNext()} className="gap-2">
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {loading ? 'Creating...' : 'Confirm Booking'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
