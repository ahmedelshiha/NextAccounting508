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
  RefreshCw,
  AlertCircle,
  FileText,
  Camera,
  Upload,
  Zap,
  TrendingUp,
  Award,
  Target,
  Bell
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

// Enhanced data types with professional features
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
  deliverables?: string[]
  prerequisites?: string[]
  tags?: string[]
  rating?: number
  completedCount?: number
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
  totalSpent?: number
  averageRating?: number
  riskLevel?: 'low' | 'medium' | 'high'
  tags?: string[]
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
  rating?: number
  completedBookings?: number
  expertise?: string[]
  hourlyRate?: number
  languages?: string[]
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

  // Professional Features
  projectCode?: string
  department?: string
  billingCode?: string
  tags?: string[]
  documents?: FileList | null
  reminderSettings?: {
    client: boolean
    staff: boolean
    followUp: boolean
  }
  
  // Notes & Follow-up
  internalNotes?: string
  clientNotes?: string
  requiresPreparation: boolean
  preparationNotes?: string
  followUpRequired: boolean
}

// Enhanced mock data with professional features
const mockServices: Service[] = [
  {
    id: 's1',
    name: 'Individual Tax Consultation',
    description: 'Comprehensive personal tax planning and filing assistance with expert guidance',
    category: 'tax',
    duration: 60,
    price: 150,
    estimatedHours: 1,
    requirements: ['Previous year tax returns', 'Income statements', 'Expense receipts'],
    isPopular: true,
    complexity: 'basic',
    deliverables: ['Tax return preparation', 'Tax planning recommendations', 'Deduction optimization'],
    prerequisites: ['Valid ID', 'Previous tax documents'],
    tags: ['personal', 'tax-filing', 'deductions'],
    rating: 4.8,
    completedCount: 250
  },
  {
    id: 's2',
    name: 'Corporate Tax Planning',
    description: 'Strategic tax planning for businesses with compliance and optimization focus',
    category: 'tax',
    duration: 120,
    price: 350,
    estimatedHours: 2,
    requirements: ['Financial statements', 'Previous tax filings', 'Business records'],
    isPopular: true,
    complexity: 'advanced',
    deliverables: ['Tax strategy document', 'Compliance checklist', 'Savings projections'],
    prerequisites: ['Business registration', 'Financial records'],
    tags: ['business', 'corporate', 'strategy'],
    rating: 4.9,
    completedCount: 180
  },
  {
    id: 's3',
    name: 'Quarterly Business Review',
    description: 'Comprehensive quarterly financial analysis with performance insights',
    category: 'audit',
    duration: 180,
    price: 500,
    estimatedHours: 3,
    requirements: ['Quarterly statements', 'Bank statements', 'Transaction records'],
    isPopular: false,
    complexity: 'advanced',
    deliverables: ['Financial analysis report', 'KPI dashboard', 'Growth recommendations'],
    prerequisites: ['Access to financial systems', 'Management availability'],
    tags: ['quarterly', 'analysis', 'kpi'],
    rating: 4.7,
    completedCount: 95
  },
  {
    id: 's4',
    name: 'Bookkeeping Setup & Training',
    description: 'Complete bookkeeping system setup with staff training and documentation',
    category: 'bookkeeping',
    duration: 90,
    price: 200,
    estimatedHours: 1.5,
    requirements: ['Business registration', 'Bank account details', 'Transaction history'],
    isPopular: true,
    complexity: 'intermediate',
    deliverables: ['System setup', 'Training materials', 'Process documentation'],
    prerequisites: ['Admin access', 'Staff availability'],
    tags: ['setup', 'training', 'systems'],
    rating: 4.6,
    completedCount: 120
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
    isActive: true,
    totalSpent: 2400,
    averageRating: 4.8,
    riskLevel: 'low',
    tags: ['reliable', 'frequent']
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
    isActive: true,
    totalSpent: 7500,
    averageRating: 4.9,
    riskLevel: 'low',
    tags: ['enterprise', 'tech', 'priority']
  },
  {
    id: 'c3',
    name: 'Mohamed Ali',
    email: 'mohamed.ali@gmail.com',
    phone: '+20555666777',
    tier: 'individual',
    totalBookings: 3,
    lastBooking: '2025-07-20',
    isActive: true,
    totalSpent: 450,
    averageRating: 4.5,
    riskLevel: 'medium',
    tags: ['new', 'individual']
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
    workingHours: { start: '09:00', end: '17:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    rating: 4.9,
    completedBookings: 340,
    expertise: ['Advanced Tax Planning', 'International Compliance'],
    hourlyRate: 250,
    languages: ['English', 'Arabic']
  },
  {
    id: 'st2',
    name: 'Jane Doe',
    role: 'Audit Manager',
    email: 'jane.doe@firm.com',
    specialties: ['Financial Audit', 'Compliance Review', 'Risk Assessment'],
    isAvailable: true,
    workingHours: { start: '08:30', end: '16:30', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    rating: 4.8,
    completedBookings: 280,
    expertise: ['SOX Compliance', 'Financial Analysis'],
    hourlyRate: 200,
    languages: ['English', 'French']
  },
  {
    id: 'st3',
    name: 'Robert Johnson',
    role: 'Business Consultant',
    email: 'robert.johnson@firm.com',
    specialties: ['Business Strategy', 'Financial Planning', 'Growth Advisory'],
    isAvailable: false,
    workingHours: { start: '10:00', end: '18:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    rating: 4.7,
    completedBookings: 195,
    expertise: ['Strategic Planning', 'Market Analysis'],
    hourlyRate: 300,
    languages: ['English', 'Spanish']
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

// Enhanced Client Selector with professional features
function EnhancedClientSelector({
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
  const [sortBy, setSortBy] = useState<'name' | 'bookings' | 'spent' | 'recent'>('name')
  const [filterTier, setFilterTier] = useState<'all' | 'individual' | 'smb' | 'enterprise'>('all')

  const filteredAndSortedClients = clients
    .filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesTier = filterTier === 'all' || client.tier === filterTier
      
      return matchesSearch && matchesTier
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'bookings':
          return b.totalBookings - a.totalBookings
        case 'spent':
          return (b.totalSpent || 0) - (a.totalSpent || 0)
        case 'recent':
          return new Date(b.lastBooking || 0).getTime() - new Date(a.lastBooking || 0).getTime()
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise': return <Building className="h-3 w-3" />
      case 'smb': return <Users className="h-3 w-3" />
      default: return <UserIcon className="h-3 w-3" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Client Selection</CardTitle>
            <CardDescription>Choose existing client or create new one</CardDescription>
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
            <Button
              variant={isNewClient ? 'default' : 'outline'}
              size="sm"
              onClick={() => onNewClientToggle(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Client
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!isNewClient ? (
          <div className="space-y-4">
            {/* Enhanced Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="name">Sort: Name</option>
                  <option value="bookings">Sort: Most Bookings</option>
                  <option value="spent">Sort: Highest Spend</option>
                  <option value="recent">Sort: Most Recent</option>
                </select>

                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value as any)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All Tiers</option>
                  <option value="individual">Individual</option>
                  <option value="smb">SMB</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            {/* Enhanced Client List */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredAndSortedClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => onClientSelect(client)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedClient?.id === client.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Client Header */}
                                              <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{client.name}</h3>
                        <div className="flex items-center gap-1">
                          {getTierIcon(client.tier)}
                          <Badge
                            variant={
                              client.tier === 'enterprise' ? 'default' : 
                              client.tier === 'smb' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {client.tier.toUpperCase()}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRiskBadgeColor(client.riskLevel || 'low')}`}
                          >
                            {client.riskLevel || 'low'} risk
                          </Badge>
                        </div>
                      </div>

                      {/* Client Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.company && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="h-3 w-3" />
                            <span>{client.company}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {client.tags && client.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {client.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Client Stats */}
                    <div className="text-right text-sm space-y-1">
                      <div className="flex items-center gap-1 text-green-600">
                        <DollarSign className="h-3 w-3" />
                        <span>${client.totalSpent || 0}</span>
                      </div>
                      <div className="text-gray-600">
                        {client.totalBookings} bookings
                      </div>
                      {client.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span>{client.averageRating}</span>
                        </div>
                      )}
                      {client.lastBooking && (
                        <div className="text-xs text-gray-500">
                          Last: {new Date(client.lastBooking).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredAndSortedClients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No clients found matching your criteria</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onNewClientToggle(true)}
                    className="mt-2"
                  >
                    Create New Client
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* New Client Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="individual">Individual</option>
                  <option value="smb">Small/Medium Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Company name"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save & Continue
              </Button>
              <Button variant="outline" onClick={() => onNewClientToggle(false)}>
                Use Existing Client
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced Service Selector
function EnhancedServiceSelector({
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
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating' | 'popular'>('popular')
  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))]
  
  const filteredAndSortedServices = services
    .filter(s => categoryFilter === 'all' || s.category === categoryFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'popular':
          return (b.completedCount || 0) - (a.completedCount || 0)
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tax': return 'bg-green-100 text-green-800'
      case 'audit': return 'bg-blue-100 text-blue-800'
      case 'consulting': return 'bg-purple-100 text-purple-800'
      case 'bookkeeping': return 'bg-orange-100 text-orange-800'
      case 'advisory': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'advanced': return 'bg-red-100 text-red-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
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
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="popular">Most Popular</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAndSortedServices.map((service) => (
            <div
              key={service.id}
              onClick={() => onServiceSelect(service)}
              className={`p-5 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedService?.id === service.id 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Service Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-base">{service.name}</h3>
                  {service.isPopular && (
                    <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Popular
                    </Badge>
                  )}
                </div>
                <Badge className={`text-xs ${getCategoryColor(service.category)}`}>
                  {service.category}
                </Badge>
              </div>

              {/* Rating and Stats */}
              <div className="flex items-center gap-4 mb-3 text-sm">
                {service.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{service.rating}</span>
                  </div>
                )}
                {service.completedCount && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{service.completedCount} completed</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>

              {/* Service Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{service.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">${service.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-gray-400" />
                  <span>{service.estimatedHours}h est.</span>
                </div>
                <div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getComplexityColor(service.complexity)}`}
                  >
                    {service.complexity}
                  </Badge>
                </div>
              </div>

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {service.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Deliverables Preview */}
              {service.deliverables && service.deliverables.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Key Deliverables:</p>
                  <div className="space-y-1">
                    {service.deliverables.slice(0, 2).map((deliverable, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{deliverable}</span>
                      </div>
                    ))}
                    {service.deliverables.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{service.deliverables.length - 2} more deliverables
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredAndSortedServices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No services found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced Scheduling Section
function EnhancedSchedulingSection({
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
  const [showStaffDetails, setShowStaffDetails] = useState(false)
  const [staffFilter, setStaffFilter] = useState<'all' | 'available' | 'expert'>('available')
  
  const availableStaff = staff.filter(s => {
    switch (staffFilter) {
      case 'available': return s.isAvailable
      case 'expert': return (s.rating || 0) >= 4.8
      default: return true
    }
  })

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

  const getAvailabilityColor = (isAvailable: boolean) => {
    return isAvailable ? 'text-green-600' : 'text-red-600'
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
      />
    ))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Scheduling & Assignment</CardTitle>
        <CardDescription>Set appointment time and assign team member</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Date and Time Selection */}
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
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
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
                  {new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true 
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Location</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'office', label: 'Office Visit', icon: Building, desc: 'In-person at our office' },
              { value: 'remote', label: 'Remote/Video', icon: Globe, desc: 'Video conference call' },
              { value: 'client_site', label: 'Client Site', icon: MapPin, desc: 'At client location' }
            ].map((option) => {
              const IconComponent = option.icon
              return (
                <div
                  key={option.value}
                  onClick={() => onLocationChange(option.value as any)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all text-center ${
                    location === option.value 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Staff Assignment */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              <User className="h-4 w-4 inline mr-1" />
              Assign Team Member
            </label>
            <div className="flex gap-2">
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value as any)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">All Staff</option>
                <option value="available">Available Only</option>
                <option value="expert">Expert Level</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStaffDetails(!showStaffDetails)}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                {showStaffDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {availableStaff.map((member) => (
              <div
                key={member.id}
                onClick={() => onStaffChange(member)}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                  assignedStaff?.id === member.id 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Staff Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                      <div className={`text-xs font-medium ${getAvailabilityColor(member.isAvailable)}`}>
                        {member.isAvailable ? '● Available' : '● Busy'}
                      </div>
                    </div>

                    {/* Staff Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{member.email}</span>
                        </div>
                        {member.rating && (
                          <div className="flex items-center gap-1">
                            {getRatingStars(member.rating)}
                            <span className="text-xs ml-1">({member.rating})</span>
                          </div>
                        )}
                      </div>

                      {/* Specialties */}
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.slice(0, showStaffDetails ? member.specialties.length : 3).map((specialty, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {!showStaffDetails && member.specialties.length > 3 && (
                          <span className="text-xs text-gray-500">+{member.specialties.length - 3} more</span>
                        )}
                      </div>

                      {/* Extended Details */}
                      {showStaffDetails && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-medium text-gray-700">Completed: </span>
                              <span>{member.completedBookings || 0}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Rate: </span>
                              <span>${member.hourlyRate || 0}/hr</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Languages: </span>
                              <span>{member.languages?.join(', ') || 'English'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Hours: </span>
                              <span>{member.workingHours.start} - {member.workingHours.end}</span>
                            </div>
                          </div>
                          
                          {member.expertise && member.expertise.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-gray-700">Expertise: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.expertise.map((exp, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    <Award className="h-2 w-2 mr-1" />
                                    {exp}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Staff Stats */}
                  <div className="text-right text-sm space-y-1">
                    {member.completedBookings && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>{member.completedBookings}</span>
                      </div>
                    )}
                    {member.hourlyRate && (
                      <div className="text-gray-600">
                        ${member.hourlyRate}/hr
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {availableStaff.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p>No staff members match the current filter</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStaffFilter('all')}
                  className="mt-2"
                >
                  Show All Staff
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EnhancedNewBooking() {
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
    followUpRequired: false,
    reminderSettings: {
      client: true,
      staff: true,
      followUp: false
    }
  })

  const [services, setServices] = useState<Service[]>(mockServices)
  const [clients, setClients] = useState<Client[]>(mockClients)
  const [team, setTeam] = useState<Staff[]>(mockStaff)
  const [loadingData, setLoadingData] = useState(false)

  const [selectedClient, setSelectedClient] = useState<Client>()
  const [selectedService, setSelectedService] = useState<Service>()
  const [assignedStaff, setAssignedStaff] = useState<Staff>()
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [serviceCategory, setServiceCategory] = useState('all')
  const [showPreview, setShowPreview] = useState(false)
  const [estimatedTotal, setEstimatedTotal] = useState(0)
  
  const stepAnchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    stepAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentStep])

  useEffect(() => {
    // Calculate estimated total based on selections
    let total = 0
    if (selectedService) {
      total += selectedService.price
      if (assignedStaff?.hourlyRate) {
        const hours = selectedService.estimatedHours
        total = Math.max(total, assignedStaff.hourlyRate * hours)
      }
    }
    setEstimatedTotal(total)
  }, [selectedService, assignedStaff])

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
    setFormData((prev) => ({ 
      ...prev, 
      assignedStaffId: staff.id, 
      assignedStaffName: staff.name 
    }))
  }

  const canProceedToNext = () => {
    const step1Valid = formData.isNewClient ? 
      Boolean(formData.clientName && formData.clientEmail) : 
      Boolean(selectedClient)
    const step2Valid = Boolean(selectedService)
    const step3Valid = Boolean(formData.scheduledDate && formData.scheduledTime && assignedStaff)

    switch (currentStep) {
      case 1: return step1Valid
      case 2: return step2Valid
      case 3: return step3Valid
      case 4: return true
      case 5: return step1Valid && step2Valid && step3Valid
      default: return false
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (!formData.serviceId || !formData.scheduledDate || !formData.scheduledTime || 
          !formData.clientName || !formData.clientEmail) {
        alert('Please complete required fields before submitting.')
        return
      }
      
      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Booking created successfully!')
      
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
          <EnhancedClientSelector
            clients={clients}
            selectedClient={selectedClient}
            onClientSelect={handleClientSelect}
            isNewClient={formData.isNewClient || false}
            onNewClientToggle={(isNew) => handleFormChange('isNewClient', isNew)}
            searchTerm={clientSearchTerm}
            onSearchChange={setClientSearchTerm}
          />
        )

      case 2:
        return (
          <EnhancedServiceSelector
            services={services}
            selectedService={selectedService}
            onServiceSelect={handleServiceSelect}
            categoryFilter={serviceCategory}
            onCategoryFilterChange={setServiceCategory}
          />
        )

      case 3:
        return (
          <EnhancedSchedulingSection
            selectedDate={formData.scheduledDate || ''}
            selectedTime={formData.scheduledTime || ''}
            duration={formData.duration || 60}
            onDateChange={(date) => handleFormChange('scheduledDate', date)}
            onTimeChange={(time) => handleFormChange('scheduledTime', time)}
            assignedStaff={assignedStaff}
            onStaffChange={handleStaffSelect}
            staff={team.filter(s => 
              !selectedService?.category || 
              !s.department || 
              s.department === selectedService.category
            )}
            location={formData.location || 'office'}
            onLocationChange={(location) => handleFormChange('location', location)}
          />
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Details & Professional Settings</CardTitle>
              <CardDescription>Configure professional features and requirements</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Business Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleFormChange('priority', e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Code</label>
                  <input
                    type="text"
                    value={formData.projectCode || ''}
                    onChange={(e) => handleFormChange('projectCode', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="PRJ-2025-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={formData.department || ''}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    <option value="tax">Tax Department</option>
                    <option value="audit">Audit Department</option>
                    <option value="consulting">Consulting</option>
                    <option value="bookkeeping">Bookkeeping</option>
                  </select>
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Supporting Documents
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, XLS files up to 10MB each
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={(e) => handleFormChange('documents', e.target.files)}
                  />
                  <Button variant="outline" size="sm" className="mt-2">
                    <Camera className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              </div>

              {/* Reminder Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Bell className="h-4 w-4 inline mr-1" />
                  Notification Settings
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="client-reminder"
                      checked={formData.reminderSettings?.client || false}
                      onChange={(e) => handleFormChange('reminderSettings', {
                        ...formData.reminderSettings,
                        client: e.target.checked
                      } as any)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="client-reminder" className="text-sm text-gray-700">
                      Send reminder to client (24 hours before)
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="staff-reminder"
                      checked={formData.reminderSettings?.staff || false}
                      onChange={(e) => handleFormChange('reminderSettings', {
                        ...formData.reminderSettings,
                        staff: e.target.checked
                      } as any)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="staff-reminder" className="text-sm text-gray-700">
                      Send reminder to assigned staff
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="followup-reminder"
                      checked={formData.reminderSettings?.followUp || false}
                      onChange={(e) => handleFormChange('reminderSettings', {
                        ...formData.reminderSettings,
                        followUp: e.target.checked
                      } as any)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="followup-reminder" className="text-sm text-gray-700">
                      Schedule follow-up reminder (1 week after completion)
                    </label>
                  </div>
                </div>
              </div>

              {/* Location-specific settings */}
              {formData.location === 'remote' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Conference Link
                  </label>
                  <input
                    type="url"
                    value={formData.meetingLink || ''}
                    onChange={(e) => handleFormChange('meetingLink', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}

              {formData.location === 'client_site' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Site Address
                  </label>
                  <textarea
                    value={formData.onSiteAddress || ''}
                    onChange={(e) => handleFormChange('onSiteAddress', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Complete address for on-site visit"
                  />
                </div>
              )}

              {/* Recurring Settings */}
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
                    Create recurring appointment series
                  </label>
                </div>

                {formData.isRecurring && (
                  <div className="ml-6 grid grid-cols-2 gap-4">
                    <div>
                      <select
                        value={formData.recurringPattern}
                        onChange={(e) => handleFormChange('recurringPattern', e.target.value as any)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Pattern</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Number of occurrences"
                        min="2"
                        max="12"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={formData.internalNotes || ''}
                    onChange={(e) => handleFormChange('internalNotes', e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Internal team notes (not visible to client)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Instructions
                  </label>
                  <textarea
                    value={formData.clientNotes || ''}
                    onChange={(e) => handleFormChange('clientNotes', e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Instructions that will be shared with the client"
                  />
                </div>
              </div>

              {/* Preparation Requirements */}
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
                    Requires advance preparation/document review
                  </label>
                </div>

                {formData.requiresPreparation && (
                  <div className="ml-6">
                    <textarea
                      value={formData.preparationNotes || ''}
                      onChange={(e) => handleFormChange('preparationNotes', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe preparation requirements and timeline"
                    />
                  </div>
                )}
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
                  <CardTitle className="text-lg">Review & Confirm Booking</CardTitle>
                  <CardDescription>Please verify all information before confirming</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Estimated Total</div>
                    <div className="text-xl font-bold text-green-600">${estimatedTotal}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Main Details */}
                <div className="space-y-6">
                  {/* Client Summary */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Client Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{formData.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span>{formData.clientEmail}</span>
                      </div>
                      {formData.clientPhone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span>{formData.clientPhone}</span>
                        </div>
                      )}
                      {formData.clientCompany && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Company:</span>
                          <span>{formData.clientCompany}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Type:</span>
                        <Badge variant="outline" className="text-xs">
                          {formData.clientType?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Service Summary */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Service Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service:</span>
                        <span className="font-medium">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Category:</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedService?.category}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span>{formData.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-medium text-green-600">
                          ${selectedService?.price}
                        </span>
                      </div>
                      {selectedService?.rating && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span>{selectedService.rating}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduling Summary */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Scheduling
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {formData.scheduledDate && new Date(formData.scheduledDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">
                          {formData.scheduledTime && new Date(`2000-01-01T${formData.scheduledTime}`).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned To:</span>
                        <span className="font-medium">{assignedStaff?.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Location:</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {formData.location?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Additional Details */}
                <div className="space-y-6">
                  {/* Professional Details */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Professional Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Priority:</span>
                        <Badge
                          variant={
                            formData.priority === 'urgent' ? 'destructive' :
                            formData.priority === 'high' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {formData.priority?.toUpperCase()}
                        </Badge>
                      </div>
                      {formData.projectCode && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Project Code:</span>
                          <span className="font-mono text-xs">{formData.projectCode}</span>
                        </div>
                      )}
                      {formData.department && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Department:</span>
                          <span className="capitalize">{formData.department}</span>
                        </div>
                      )}
                      {formData.isRecurring && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Recurring:</span>
                          <Badge variant="outline" className="text-xs">
                            {formData.recurringPattern}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Staff Details */}
                  {assignedStaff && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Assigned Professional
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{assignedStaff.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Role:</span>
                          <span>{assignedStaff.role}</span>
                        </div>
                        {assignedStaff.rating && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Rating:</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span>{assignedStaff.rating}</span>
                            </div>
                          </div>
                        )}
                        {assignedStaff.hourlyRate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rate:</span>
                            <span>${assignedStaff.hourlyRate}/hr</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notifications
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Client Reminder:</span>
                        <Badge
                          variant={formData.reminderSettings?.client ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {formData.reminderSettings?.client ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Staff Reminder:</span>
                        <Badge
                          variant={formData.reminderSettings?.staff ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {formData.reminderSettings?.staff ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Follow-up:</span>
                        <Badge
                          variant={formData.reminderSettings?.followUp ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {formData.reminderSettings?.followUp ? 'Scheduled' : 'None'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Notes Summary */}
                  {(formData.internalNotes || formData.clientNotes || formData.preparationNotes) && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Notes & Instructions
                      </h3>
                      <div className="space-y-3 text-sm">
                        {formData.internalNotes && (
                          <div>
                            <span className="text-gray-600 block mb-1 font-medium">Internal:</span>
                            <p className="bg-yellow-50 p-2 rounded text-xs border-l-2 border-yellow-200">
                              {formData.internalNotes}
                            </p>
                          </div>
                        )}
                        {formData.clientNotes && (
                          <div>
                            <span className="text-gray-600 block mb-1 font-medium">Client Instructions:</span>
                            <p className="bg-blue-50 p-2 rounded text-xs border-l-2 border-blue-200">
                              {formData.clientNotes}
                            </p>
                          </div>
                        )}
                        {formData.preparationNotes && (
                          <div>
                            <span className="text-gray-600 block mb-1 font-medium">Preparation Required:</span>
                            <p className="bg-orange-50 p-2 rounded text-xs border-l-2 border-orange-200">
                              {formData.preparationNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Requirements Preview */}
              {showPreview && selectedService && (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Service Requirements & Deliverables
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Requirements */}
                    <div>
                      <h5 className="font-medium text-gray-800 mb-3">Required Documents:</h5>
                      <div className="space-y-2">
                        {selectedService.requirements.map((req, idx) => (
                          <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deliverables */}
                    {selectedService.deliverables && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-3">Expected Deliverables:</h5>
                        <div className="space-y-2">
                          {selectedService.deliverables.map((deliverable, idx) => (
                            <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-500" />
                              <span>{deliverable}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Professional Booking</h1>
              <p className="text-gray-600">Create a comprehensive client appointment with advanced features</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Estimated Total</div>
              <div className="text-2xl font-bold text-green-600">${estimatedTotal}</div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                      currentStep === step.number
                        ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                        : currentStep > step.number
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className={`text-sm font-semibold ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-6 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Anchor */}
        <div ref={stepAnchorRef}></div>

        {/* Main Content */}
        <div className="mb-8">
          {loadingData ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-lg text-gray-600">Loading professional booking system...</p>
              <p className="text-sm text-gray-500">Preparing client data, services, and team assignments</p>
            </div>
          ) : (
            renderStepContent()
          )}
        </div>

        {/* Navigation Footer */}
        <Card className="sticky bottom-6 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left Side - Summary */}
              <div className="flex items-center gap-6">
                {selectedClient && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{selectedClient.name}</span>
                  </div>
                )}
                {selectedService && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>{selectedService.name}</span>
                  </div>
                )}
                {assignedStaff && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="h-4 w-4" />
                    <span>{assignedStaff.name}</span>
                  </div>
                )}
              </div>

              {/* Right Side - Navigation */}
              <div className="flex items-center gap-4">
                {/* Previous Button */}
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}

                {/* Step Indicator */}
                <div className="text-sm text-gray-500">
                  Step {currentStep} of {steps.length}
                </div>

                {/* Next/Submit Button */}
                {currentStep < 5 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceedToNext()}
                    className="gap-2 px-6"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !canProceedToNext()}
                      className="gap-2 px-6 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {loading ? 'Creating Booking...' : 'Confirm Professional Booking'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}