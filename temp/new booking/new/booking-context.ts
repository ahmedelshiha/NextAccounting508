// contexts/BookingContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { BookingFormData, BookingDetail, Service, Client, Staff } from '@/types'

interface BookingState {
  // Form data
  formData: Partial<BookingFormData>
  currentStep: number
  
  // Selections
  selectedClient?: Client
  selectedService?: Service
  assignedStaff?: Staff
  
  // UI state
  loading: boolean
  saving: boolean
  errors: Record<string, string>
  
  // Data
  estimatedTotal: number
  
  // Search and filters
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
    timezone: 'Africa/Cairo',
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
    reminderSettings: {
      client: true,
      staff: true,
      followUp: false
    }
  },
  currentStep: 1,
  loading: false,
  saving: false,
  errors: {},
  estimatedTotal: 0,
  clientSearchTerm: '',
  serviceCategory: 'all',
  staffFilter: 'available'
}

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload }
      }
      
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload
      }
      
    case 'SELECT_CLIENT':
      return {
        ...state,
        selectedClient: action.payload,
        formData: action.payload ? {
          ...state.formData,
          clientId: action.payload.id,
          clientName: action.payload.name,
          clientEmail: action.payload.email,
          clientPhone: action.payload.phone || '',
          clientCompany: action.payload.company,
          clientType: action.payload.tier,
          isNewClient: false
        } : {
          ...state.formData,
          clientId: undefined,
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          clientCompany: undefined,
          isNewClient: true
        }
      }
      
    case 'SELECT_SERVICE':
      const estimatedRevenue = action.payload?.price || 0
      return {
        ...state,
        selectedService: action.payload,
        formData: action.payload ? {
          ...state.formData,
          serviceId: action.payload.id,
          serviceName: action.payload.name,
          duration: action.payload.duration,
          expectedRevenue: estimatedRevenue,
          estimatedComplexity: action.payload.complexity
        } : {
          ...state.formData,
          serviceId: '',
          serviceName: '',
          expectedRevenue: 0
        },
        estimatedTotal: estimatedRevenue
      }
      
    case 'ASSIGN_STAFF':
      return {
        ...state,
        assignedStaff: action.payload,
        formData: action.payload ? {
          ...state.formData,
          assignedStaffId: action.payload.id,
          assignedStaffName: action.payload.name
        } : {
          ...state.formData,
          assignedStaffId: undefined,
          assignedStaffName: undefined
        }
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
  // Helper functions
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
  
  const updateFormData = (data: Partial<BookingFormData>) => {
    dispatch({ type: 'SET_FORM_DATA', payload: data })
  }
  
  const selectClient = (client: Client | undefined) => {
    dispatch({ type: 'SELECT_CLIENT', payload: client })
  }
  
  const selectService = (service: Service | undefined) => {
    dispatch({ type: 'SELECT_SERVICE', payload: service })
  }
  
  const assignStaff = (staff: Staff | undefined) => {
    dispatch({ type: 'ASSIGN_STAFF', payload: staff })
  }
  
  const nextStep = () => {
    if (canProceedToNext()) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep + 1 })
    }
  }
  
  const prevStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 })
    }
  }
  
  const canProceedToNext = (): boolean => {
    const { formData, selectedClient, selectedService, assignedStaff, currentStep } = state
    
    switch (currentStep) {
      case 1: // Client selection
        return formData.isNewClient 
          ? Boolean(formData.clientName && formData.clientEmail)
          : Boolean(selectedClient)
          
      case 2: // Service selection
        return Boolean(selectedService)
        
      case 3: // Scheduling
        return Boolean(
          formData.scheduledDate && 
          formData.scheduledTime && 
          assignedStaff
        )
        
      case 4: // Details
        return true // Optional step
        
      case 5: // Review
        return Boolean(
          (formData.isNewClient ? formData.clientName && formData.clientEmail : selectedClient) &&
          selectedService &&
          formData.scheduledDate &&
          formData.scheduledTime &&
          assignedStaff
        )
        
      default:
        return false
    }
  }
  
  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' })
  }
  
  const value = {
    state,
    dispatch,
    updateFormData,
    selectClient,
    selectService,
    assignStaff,
    nextStep,
    prevStep,
    canProceedToNext,
    resetForm
  }
  
  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBookingContext() {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBookingContext must be used within a BookingProvider')
  }
  return context
}