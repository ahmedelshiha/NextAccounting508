// types/booking.ts
export interface BookingDetail {
  id: string
  clientId?: string
  serviceId?: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  scheduledAt: string
  duration: number
  notes?: string | null
  adminNotes?: string | null
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  confirmed?: boolean
  reminderSent?: boolean
  createdAt?: string
  updatedAt?: string
  assignedTeamMember?: TeamMember
  service: ServiceLite
  client: ClientLite
  location?: 'office' | 'remote' | 'client_site'
  meetingLink?: string
  onSiteAddress?: string
  priority?: 'normal' | 'high' | 'urgent'
  paymentStatus?: 'pending' | 'paid' | 'refunded'
  recurringInfo?: RecurringInfo
  projectCode?: string
  department?: string
  billingCode?: string
  tags?: string[]
}

export interface RecurringInfo {
  isRecurring: boolean
  pattern?: 'weekly' | 'monthly' | 'quarterly'
  nextBookingDate?: string
  occurrences?: number
}

export interface AdminNote {
  id: number
  text: string
  createdAt: string
  createdBy: string
  userName: string
  priority?: 'normal' | 'high' | 'urgent'
  category?: 'general' | 'follow-up' | 'issue' | 'billing'
}

export interface BookingFilters {
  status?: BookingDetail['status'][]
  priority?: BookingDetail['priority'][]
  location?: BookingDetail['location'][]
  assignedStaffId?: string
  clientId?: string
  serviceId?: string
  dateFrom?: string
  dateTo?: string
  searchTerm?: string
}

export interface BookingFormData {
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
  reminderSettings?: ReminderSettings
  
  // Notes & Follow-up
  internalNotes?: string
  clientNotes?: string
  requiresPreparation: boolean
  preparationNotes?: string
  followUpRequired: boolean
}

export interface ReminderSettings {
  client: boolean
  staff: boolean
  followUp: boolean
}

// types/service.ts
export interface Service {
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

export interface ServiceLite {
  id: string
  name: string
  price?: number
  duration?: number | null
  category?: string | null
  slug?: string
}

// types/client.ts
export interface Client {
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

export interface ClientLite {
  id?: string
  name?: string | null
  email: string
  phone?: string | null
  _count?: { bookings?: number }
}

// types/staff.ts
export interface Staff {
  id: string
  name: string
  role: string
  email: string
  avatar?: string
  specialties: string[]
  isAvailable: boolean
  workingHours: WorkingHours
  department?: 'tax' | 'audit' | 'consulting' | 'bookkeeping' | 'advisory' | 'admin'
  rating?: number
  completedBookings?: number
  expertise?: string[]
  hourlyRate?: number
  languages?: string[]
}

export interface TeamMember {
  id: string
  name: string
  email: string
}

export interface WorkingHours {
  start: string
  end: string
  days: string[]
}

// types/api.ts
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CreateBookingRequest {
  clientId?: string
  serviceId: string
  scheduledAt: string
  duration: number
  location: BookingDetail['location']
  priority?: BookingDetail['priority']
  notes?: string
  internalNotes?: string
  assignedStaffId?: string
  reminderSettings?: ReminderSettings
}

export interface UpdateBookingRequest extends Partial<CreateBookingRequest> {
  status?: BookingDetail['status']
  confirmed?: boolean
}

// types/form.ts
export interface FormStep {
  number: number
  title: string
  description: string
  isValid: boolean
  isCompleted: boolean
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FilterState {
  search: string
  category: string
  sort: string
  filters: Record<string, any>
}