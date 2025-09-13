// utils/api.ts
import { 
  BookingDetail, 
  CreateBookingRequest, 
  UpdateBookingRequest,
  Client,
  Service,
  Staff,
  AdminNote
} from '@/types'

// Mock API delay for realistic loading states
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data - In a real app, this would come from your backend
import { mockClients, mockServices, mockStaff, mockBookings } from './mock-data'

class ApiClient {
  // Booking endpoints
  bookings = {
    list: async (filters?: any): Promise<BookingDetail[]> => {
      await mockDelay()
      return mockBookings
    },

    get: async (id: string): Promise<BookingDetail> => {
      await mockDelay()
      const booking = mockBookings.find(b => b.id === id)
      if (!booking) {
        throw new Error(`Booking with id ${id} not found`)
      }
      return booking
    },

    create: async (data: CreateBookingRequest): Promise<BookingDetail> => {
      await mockDelay()
      
      // Simulate validation
      if (!data.serviceId || !data.scheduledAt || !data.clientId) {
        throw new Error('Missing required fields')
      }

      const newBooking: BookingDetail = {
        id: `booking-${Date.now()}`,
        clientId: data.clientId,
        serviceId: data.serviceId,
        status: 'PENDING',
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        notes: data.notes,
        adminNotes: JSON.stringify([]),
        clientName: 'New Client', // Would be populated from client data
        clientEmail: 'client@example.com',
        clientPhone: '+1234567890',
        confirmed: false,
        reminderSent: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTeamMember: data.assignedStaffId ? {
          id: data.assignedStaffId,
          name: 'Staff Member',
          email: 'staff@example.com'
        } : undefined,
        service: {
          id: data.serviceId,
          name: 'Service Name',
          price: 150,
          duration: data.duration
        },
        client: {
          email: 'client@example.com',
          name: 'Client Name',
          _count: { bookings: 1 }
        },
        location: data.location,
        priority: data.priority,
        paymentStatus: 'pending'
      }

      mockBookings.push(newBooking)
      return newBooking
    },

    update: async (id: string, data: UpdateBookingRequest): Promise<BookingDetail> => {
      await mockDelay()
      
      const bookingIndex = mockBookings.findIndex(b => b.id === id)
      if (bookingIndex === -1) {
        throw new Error(`Booking with id ${id} not found`)
      }

      const updatedBooking = {
        ...mockBookings[bookingIndex],
        ...data,
        updatedAt: new Date().toISOString()
      }

      mockBookings[bookingIndex] = updatedBooking
      return updatedBooking
    },

    delete: async (id: string): Promise<void> => {
      await mockDelay()
      const index = mockBookings.findIndex(b => b.id === id)
      if (index === -1) {
        throw new Error(`Booking with id ${id} not found`)
      }
      mockBookings.splice(index, 1)
    }
  }

  // Client endpoints
  clients = {
    list: async (): Promise<Client[]> => {
      await mockDelay()
      return mockClients
    },

    get: async (id: string): Promise<Client> => {
      await mockDelay()
      const client = mockClients.find(c => c.id === id)
      if (!client) {
        throw new Error(`Client with id ${id} not found`)
      }
      return client
    },

    create: async (data: Omit<Client, 'id'>): Promise<Client> => {
      await mockDelay()
      
      const newClient: Client = {
        id: `client-${Date.now()}`,
        ...data
      }

      mockClients.push(newClient)
      return newClient
    },

    update: async (id: string, data: Partial<Client>): Promise<Client> => {
      await mockDelay()
      
      const clientIndex = mockClients.findIndex(c => c.id === id)
      if (clientIndex === -1) {
        throw new Error(`Client with id ${id} not found`)
      }

      const updatedClient = { ...mockClients[clientIndex], ...data }
      mockClients[clientIndex] = updatedClient
      return updatedClient
    }
  }

  // Service endpoints
  services = {
    list: async (): Promise<Service[]> => {
      await mockDelay()
      return mockServices
    },

    get: async (id: string): Promise<Service> => {
      await mockDelay()
      const service = mockServices.find(s => s.id === id)
      if (!service) {
        throw new Error(`Service with id ${id} not found`)
      }
      return service
    },

    update: async (id: string, data: Partial<Service>): Promise<Service> => {
      await mockDelay()
      
      const serviceIndex = mockServices.findIndex(s => s.id === id)
      if (serviceIndex === -1) {
        throw new Error(`Service with id ${id} not found`)
      }

      const updatedService = { ...mockServices[serviceIndex], ...data }
      mockServices[serviceIndex] = updatedService
      return updatedService
    }
  }

  // Staff endpoints
  staff = {
    list: async (): Promise<Staff[]> => {
      await mockDelay()
      return mockStaff
    },

    get: async (id: string): Promise<Staff> => {
      await mockDelay()
      const staff = mockStaff.find(s => s.id === id)
      if (!staff) {
        throw new Error(`Staff with id ${id} not found`)
      }
      return staff
    },

    update: async (id: string, data: Partial<Staff>): Promise<Staff> => {
      await mockDelay()
      
      const staffIndex = mockStaff.findIndex(s => s.id === id)
      if (staffIndex === -1) {
        throw new Error(`Staff with id ${id} not found`)
      }

      const updatedStaff = { ...mockStaff[staffIndex], ...data }
      mockStaff[staffIndex] = updatedStaff
      return updatedStaff
    }
  }

  // Admin notes endpoints
  adminNotes = {
    create: async (bookingId: string, noteData: Omit<AdminNote, 'id' | 'createdAt'>): Promise<AdminNote> => {
      await mockDelay()
      
      const note: AdminNote = {
        id: Date.now(),
        ...noteData,
        createdAt: new Date().toISOString()
      }

      // Update booking with new note
      const booking = mockBookings.find(b => b.id === bookingId)
      if (booking) {
        const existingNotes = booking.adminNotes ? JSON.parse(booking.adminNotes) : []
        existingNotes.push(note)
        booking.adminNotes = JSON.stringify(existingNotes)
      }

      return note
    }
  }
}

export const api = new ApiClient()

// utils/formatting.ts
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return new Date(dateString).toLocaleDateString('en-US', { ...defaultOptions, ...options })
}

export const formatTime = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
  
  return new Date(dateString).toLocaleTimeString('en-US', { ...defaultOptions, ...options })
}

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

export const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

export const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }
  
  return formatDate(dateString, { month: 'short', day: 'numeric', year: 'numeric' })
}

// utils/validation.ts
import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  clientType: z.enum(['individual', 'smb', 'enterprise'])
})

export const bookingSchema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  clientEmail: z.string().email('Valid email is required'),
  serviceId: z.string().min(1, 'Please select a service'),
  scheduledDate: z.string().min(1, 'Please select a date'),
  scheduledTime: z.string().min(1, 'Please select a time'),
  assignedStaffId: z.string().min(1, 'Please assign a staff member'),
  location: z.enum(['office', 'remote', 'client_site']),
  priority: z.enum(['normal', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional()
})

export const validateForm = <T>(schema: z.ZodSchema<T>, data: any): { 
  isValid: boolean
  errors: Record<string, string>
  data?: T 
} => {
  try {
    const validatedData = schema.parse(data)
    return { isValid: true, errors: {}, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach(err => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message
        }
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { general: 'Validation failed' } }
  }
}

// utils/constants.ts
export const BOOKING_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
} as const

export const PRIORITY_LEVELS = {
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const

export const LOCATION_TYPES = {
  OFFICE: 'office',
  REMOTE: 'remote',
  CLIENT_SITE: 'client_site'
} as const

export const CLIENT_TIERS = {
  INDIVIDUAL: 'individual',
  SMB: 'smb',
  ENTERPRISE: 'enterprise'
} as const

export const SERVICE_CATEGORIES = {
  TAX: 'tax',
  AUDIT: 'audit',
  CONSULTING: 'consulting',
  BOOKKEEPING: 'bookkeeping',
  ADVISORY: 'advisory'
} as const

export const TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Africa/Cairo', label: 'Egypt Standard Time (EET)' }
]

export const WORKING_HOURS = {
  START: '09:00',
  END: '17:00',
  LUNCH_START: '12:00',
  LUNCH_END: '13:00'
}

export const BUSINESS_HOURS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
]

// utils/helpers.ts
export const generateId = (prefix: string = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const classNames = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}

export const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const generateTimeSlots = (
  startHour: number = 8,
  endHour: number = 18,
  intervalMinutes: number = 30
): string[] => {
  const slots: string[] = []
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(time)
    }
  }
  
  return slots
}

export const isBusinessHour = (time: string, workingHours = WORKING_HOURS) => {
  return time >= workingHours.START && time <= workingHours.END &&
         !(time >= workingHours.LUNCH_START && time <= workingHours.LUNCH_END)
}

export const calculateEndTime = (startTime: string, durationMinutes: number) => {
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
  
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
}

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}