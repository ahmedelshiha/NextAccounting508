"use client"

import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// Local types tailored for booking flow
export interface Service {
  id: string
  name: string
  description?: string | null
  duration: number
  price?: number
  complexity?: 'basic' | 'intermediate' | 'advanced'
  estimatedHours?: number
  category?: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  tier?: 'individual' | 'smb' | 'enterprise'
}

export interface Staff {
  id: string
  name: string
  email: string
  hourlyRate?: number
}

export interface ReminderSettings {
  client: boolean
  staff: boolean
  followUp: boolean
}

export interface BookingFormData {
  clientId?: string
  isNewClient: boolean
  clientName: string
  clientEmail: string
  clientPhone: string
  clientCompany?: string
  clientType: 'individual' | 'smb' | 'enterprise'

  serviceId: string
  serviceName: string
  customRequirements?: string
  estimatedComplexity?: 'basic' | 'intermediate' | 'advanced'

  scheduledDate: string
  scheduledTime: string
  duration: number
  timezone: string

  assignedStaffId?: string
  assignedStaffName?: string

  location: 'office' | 'remote' | 'client_site'
  meetingLink?: string
  onSiteAddress?: string
  specialInstructions?: string

  priority: 'normal' | 'high' | 'urgent'
  isRecurring: boolean
  recurringPattern?: 'weekly' | 'monthly' | 'quarterly'
  source: 'website' | 'referral' | 'direct' | 'marketing'
  expectedRevenue: number

  projectCode?: string
  department?: string
  billingCode?: string
  tags?: string[]
  documents?: FileList | null
  reminderSettings?: ReminderSettings

  internalNotes?: string
  clientNotes?: string
  requiresPreparation: boolean
  preparationNotes?: string
  followUpRequired: boolean
}

interface BookingState {
  formData: Partial<BookingFormData>
  currentStep: number

  selectedClient?: Client
  selectedService?: Service
  assignedStaff?: Staff

  loading: boolean
  saving: boolean
  errors: Record<string, string>

  estimatedTotal: number
  clientSearchTerm: string
  serviceCategory: string
  staffFilter: string
}

type BookingAction =
  | { type: 'SET_FORM_DATA'; payload: Partial<BookingFormData> }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SELECT_CLIENT'; payload: Client | undefined }
  | { type: 'SELECT_SERVICE'; payload: Service | undefined }
  | { type: 'ASSIGN_STAFF'; payload: Staff | undefined }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_ESTIMATED_TOTAL'; payload: number }
  | { type: 'SET_CLIENT_SEARCH'; payload: string }
  | { type: 'SET_SERVICE_CATEGORY'; payload: string }
  | { type: 'SET_STAFF_FILTER'; payload: string }
  | { type: 'RESET_FORM' }

const initialState: BookingState = {
  formData: {
    isNewClient: false,
    clientType: 'individual',
    location: 'office',
    priority: 'normal',
    isRecurring: false,
    source: 'direct',
    timezone: 'UTC',
    requiresPreparation: false,
    followUpRequired: false,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceId: '',
    serviceName: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    expectedRevenue: 0,
    reminderSettings: { client: true, staff: true, followUp: false },
  },
  currentStep: 1,
  loading: false,
  saving: false,
  errors: {},
  estimatedTotal: 0,
  clientSearchTerm: '',
  serviceCategory: 'all',
  staffFilter: 'available',
}

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } }
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload }
    case 'SELECT_CLIENT':
      return {
        ...state,
        selectedClient: action.payload,
        formData: action.payload
          ? {
              ...state.formData,
              clientId: action.payload.id,
              clientName: action.payload.name,
              clientEmail: action.payload.email,
              clientPhone: action.payload.phone || '',
              clientCompany: action.payload.company,
              clientType: action.payload.tier || 'individual',
              isNewClient: false,
            }
          : {
              ...state.formData,
              clientId: undefined,
              clientName: '',
              clientEmail: '',
              clientPhone: '',
              clientCompany: undefined,
              isNewClient: true,
            },
      }
    case 'SELECT_SERVICE': {
      const estimatedRevenue = action.payload?.price || 0
      return {
        ...state,
        selectedService: action.payload,
        formData: action.payload
          ? {
              ...state.formData,
              serviceId: action.payload.id,
              serviceName: action.payload.name,
              duration: action.payload.duration,
              expectedRevenue: estimatedRevenue,
              estimatedComplexity: action.payload.complexity,
            }
          : {
              ...state.formData,
              serviceId: '',
              serviceName: '',
              expectedRevenue: 0,
            },
        estimatedTotal: estimatedRevenue,
      }
    }
    case 'ASSIGN_STAFF':
      return {
        ...state,
        assignedStaff: action.payload,
        formData: action.payload
          ? { ...state.formData, assignedStaffId: action.payload.id, assignedStaffName: action.payload.name }
          : { ...state.formData, assignedStaffId: undefined, assignedStaffName: undefined },
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_SAVING':
      return { ...state, saving: action.payload }
    case 'SET_ERRORS':
      return { ...state, errors: action.payload }
    case 'SET_ESTIMATED_TOTAL':
      return { ...state, estimatedTotal: action.payload }
    case 'SET_CLIENT_SEARCH':
      return { ...state, clientSearchTerm: action.payload }
    case 'SET_SERVICE_CATEGORY':
      return { ...state, serviceCategory: action.payload }
    case 'SET_STAFF_FILTER':
      return { ...state, staffFilter: action.payload }
    case 'RESET_FORM':
      return initialState
    default:
      return state
  }
}

const BookingContext = createContext<{
  state: BookingState
  dispatch: React.Dispatch<BookingAction>
  updateFormData: (data: Partial<BookingFormData>) => void
  selectClient: (client: Client | undefined) => void
  selectService: (service: Service | undefined) => void
  assignStaff: (staff: Staff | undefined) => void
  nextStep: () => void
  prevStep: () => void
  canProceedToNext: () => boolean
  resetForm: () => void
} | undefined>(undefined)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState)

  const updateFormData = (data: Partial<BookingFormData>) => dispatch({ type: 'SET_FORM_DATA', payload: data })
  const selectClient = (client: Client | undefined) => dispatch({ type: 'SELECT_CLIENT', payload: client })
  const selectService = (service: Service | undefined) => dispatch({ type: 'SELECT_SERVICE', payload: service })
  const assignStaff = (staff: Staff | undefined) => dispatch({ type: 'ASSIGN_STAFF', payload: staff })

  const nextStep = () => { if (canProceedToNext()) dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep + 1 }) }
  const prevStep = () => { if (state.currentStep > 1) dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 }) }

  const canProceedToNext = (): boolean => {
    const { formData, selectedClient, selectedService, assignedStaff, currentStep } = state
    switch (currentStep) {
      case 1:
        return formData.isNewClient ? Boolean(formData.clientName && formData.clientEmail) : Boolean(selectedClient)
      case 2:
        return Boolean(selectedService)
      case 3:
        return Boolean(formData.scheduledDate && formData.scheduledTime && assignedStaff)
      case 4:
        return true
      case 5:
        return Boolean((formData.isNewClient ? formData.clientName && formData.clientEmail : selectedClient) && selectedService && formData.scheduledDate && formData.scheduledTime && assignedStaff)
      default:
        return false
    }
  }

  const resetForm = () => dispatch({ type: 'RESET_FORM' })

  const value = { state, dispatch, updateFormData, selectClient, selectService, assignStaff, nextStep, prevStep, canProceedToNext, resetForm }
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBookingContext() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBookingContext must be used within a BookingProvider')
  return ctx
}
