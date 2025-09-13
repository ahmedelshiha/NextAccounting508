// components/booking/new-booking/NewBookingPage.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, CheckCircle, Save, Send, RefreshCw } from 'lucide-react'
import { BookingProvider, useBookingContext } from '@/contexts/BookingContext'
import { useBookings, useClients, useServices, useStaff } from '@/hooks'
import ClientSelector from './ClientSelector'
import ServiceSelector from './ServiceSelector'
import SchedulingSection from './SchedulingSection'
import BookingDetailsForm from './BookingDetailsForm'
import BookingReview from './BookingReview'
import ProgressIndicator from './ProgressIndicator'
import NavigationFooter from './NavigationFooter'

const steps = [
  { number: 1, title: 'Client', description: 'Select or create client' },
  { number: 2, title: 'Service', description: 'Choose service type' },
  { number: 3, title: 'Schedule', description: 'Set date and assign staff' },
  { number: 4, title: 'Details', description: 'Additional information' },
  { number: 5, title: 'Review', description: 'Confirm booking details' }
]

// Main content component that uses the booking context
function NewBookingContent() {
  const { 
    state, 
    dispatch,
    updateFormData, 
    selectClient, 
    selectService, 
    assignStaff,
    nextStep,
    prevStep,
    canProceedToNext
  } = useBookingContext()

  const stepAnchorRef = useRef<HTMLDivElement>(null)

  // Custom hooks for data management
  const { clients, loading: clientsLoading } = useClients()
  const { services, loading: servicesLoading } = useServices()
  const { staff, loading: staffLoading } = useStaff()
  const { createBooking, loading: submissionLoading } = useBookings()

  // Scroll to step anchor when step changes
  useEffect(() => {
    stepAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [state.currentStep])

  // Update estimated total when selections change
  useEffect(() => {
    let total = 0
    if (state.selectedService) {
      total += state.selectedService.price
      if (state.assignedStaff?.hourlyRate) {
        const hours = state.selectedService.estimatedHours
        total = Math.max(total, state.assignedStaff.hourlyRate * hours)
      }
    }
    dispatch({ type: 'SET_ESTIMATED_TOTAL', payload: total })
  }, [state.selectedService, state.assignedStaff, dispatch])

  const handleFormChange = <K extends keyof typeof state.formData>(
    field: K, 
    value: typeof state.formData[K]
  ) => {
    updateFormData({ [field]: value })
  }

  const handleSubmit = async () => {
    dispatch({ type: 'SET_SAVING', payload: true })
    
    try {
      if (!state.formData.serviceId || !state.formData.scheduledDate || 
          !state.formData.scheduledTime || !state.formData.clientName || 
          !state.formData.clientEmail) {
        throw new Error('Please complete required fields before submitting.')
      }
      
      const scheduledAt = new Date(`${state.formData.scheduledDate}T${state.formData.scheduledTime}:00`)
      
      const bookingData = {
        clientId: state.formData.clientId,
        serviceId: state.formData.serviceId,
        scheduledAt: scheduledAt.toISOString(),
        duration: state.formData.duration || 60,
        location: state.formData.location || 'office',
        priority: state.formData.priority || 'normal',
        notes: state.formData.clientNotes,
        internalNotes: state.formData.internalNotes,
        assignedStaffId: state.formData.assignedStaffId,
        reminderSettings: state.formData.reminderSettings
      }
      
      await createBooking(bookingData)
      
      // Success - could redirect or show success message
      alert('Booking created successfully!')
      
    } catch (error) {
      console.error('Error creating booking:', error)
      dispatch({ type: 'SET_ERRORS', payload: { 
        submit: error instanceof Error ? error.message : 'Failed to create booking. Please try again.'
      }})
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false })
    }
  }

  const renderStepContent = () => {
    const isLoading = clientsLoading || servicesLoading || staffLoading

    switch (state.currentStep) {
      case 1:
        return (
          <ClientSelector
            clients={clients}
            selectedClient={state.selectedClient}
            onClientSelect={selectClient}
            isNewClient={state.formData.isNewClient || false}
            onNewClientToggle={(isNew) => handleFormChange('isNewClient', isNew)}
            searchTerm={state.clientSearchTerm}
            onSearchChange={(term) => dispatch({ type: 'SET_CLIENT_SEARCH', payload: term })}
            loading={clientsLoading}
          />
        )

      case 2:
        return (
          <ServiceSelector
            services={services}
            selectedService={state.selectedService}
            onServiceSelect={selectService}
            categoryFilter={state.serviceCategory}
            onCategoryFilterChange={(category) => dispatch({ type: 'SET_SERVICE_CATEGORY', payload: category })}
            loading={servicesLoading}
          />
        )

      case 3:
        return (
          <SchedulingSection
            selectedDate={state.formData.scheduledDate || ''}
            selectedTime={state.formData.scheduledTime || ''}
            duration={state.formData.duration || 60}
            onDateChange={(date) => handleFormChange('scheduledDate', date)}
            onTimeChange={(time) => handleFormChange('scheduledTime', time)}
            assignedStaff={state.assignedStaff}
            onStaffChange={assignStaff}
            staff={staff.filter(s => 
              !state.selectedService?.category || 
              !s.department || 
              s.department === state.selectedService.category
            )}
            location={state.formData.location || 'office'}
            onLocationChange={(location) => handleFormChange('location', location)}
            loading={staffLoading}
          />
        )

      case 4:
        return (
          <BookingDetailsForm
            formData={state.formData}
            onFormChange={handleFormChange}
            selectedService={state.selectedService}
            loading={state.loading}
          />
        )

      case 5:
        return (
          <BookingReview
            formData={state.formData}
            selectedClient={state.selectedClient}
            selectedService={state.selectedService}
            assignedStaff={state.assignedStaff}
            estimatedTotal={state.estimatedTotal}
            onSubmit={handleSubmit}
            loading={submissionLoading || state.saving}
            errors={state.errors}
          />
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.history.back()} 
              className="gap-2"
            >
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
              <div className="text-2xl font-bold text-green-600">${state.estimatedTotal}</div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator 
          steps={steps} 
          currentStep={state.currentStep} 
          onStepClick={(step) => dispatch({ type: 'SET_CURRENT_STEP', payload: step })}
        />

        {/* Step Anchor */}
        <div ref={stepAnchorRef} className="scroll-mt-4"></div>

        {/* Main Content */}
        <div className="mb-8">
          {state.loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-lg text-gray-600">Loading professional booking system...</p>
                <p className="text-sm text-gray-500">Preparing client data, services, and team assignments</p>
              </CardContent>
            </Card>
          ) : (
            renderStepContent()
          )}
        </div>

        {/* Error Display */}
        {Object.keys(state.errors).length > 0 && (
          <Card className="mb-8 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 text-red-800">
                <div className="bg-red-100 p-1 rounded">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium">Please address the following issues:</h4>
                  <ul className="mt-2 space-y-1">
                    {Object.entries(state.errors).map(([field, error]) => (
                      <li key={field} className="text-sm">• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Footer */}
        <NavigationFooter
          steps={steps}
          currentStep={state.currentStep}
          canProceedToNext={canProceedToNext()}
          onPrevStep={prevStep}
          onNextStep={nextStep}
          onSubmit={handleSubmit}
          isSubmitting={submissionLoading || state.saving}
          selectedClient={state.selectedClient}
          selectedService={state.selectedService}
          assignedStaff={state.assignedStaff}
          estimatedTotal={state.estimatedTotal}
        />
      </div>
    </div>
  )
}

// Main component wrapper with provider
export default function NewBookingPage() {
  return (
    <BookingProvider>
      <NewBookingContent />
    </BookingProvider>
  )
}

// components/booking/new-booking/ProgressIndicator.tsx
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

interface Step {
  number: number
  title: string
  description: string
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick
}) => {
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all cursor-pointer ${
                  currentStep === step.number
                    ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                    : currentStep > step.number
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
                onClick={() => onStepClick?.(step.number)}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <span className="font-semibold">{step.number}</span>
                )}
              </div>
              
              <div className="ml-4">
                <div className={`text-sm font-semibold ${
                  currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-6 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProgressIndicator