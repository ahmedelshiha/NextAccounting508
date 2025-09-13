// hooks/useClients.ts
import { useState, useEffect } from 'react'
import { Client } from '@/types'
import { api } from '@/utils/api'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true)
        setError(null)
        const data = await api.staff.list()
        setStaff(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch staff')
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [])

  const updateStaffAvailability = async (staffId: string, isAvailable: boolean) => {
    try {
      const updatedStaff = await api.staff.update(staffId, { isAvailable })
      setStaff(prev => prev.map(member => 
        member.id === staffId ? { ...member, isAvailable } : member
      ))
      return updatedStaff
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update staff availability')
    }
  }

  return {
    staff,
    loading,
    error,
    updateStaffAvailability
  }
}

// hooks/useBookings.ts
import { useState, useCallback } from 'react'
import { BookingDetail, CreateBookingRequest, UpdateBookingRequest } from '@/types'
import { api } from '@/utils/api'

export function useBookings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createBooking = useCallback(async (bookingData: CreateBookingRequest) => {
    try {
      setLoading(true)
      setError(null)
      const newBooking = await api.bookings.create(bookingData)
      return newBooking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateBooking = useCallback(async (id: string, updates: UpdateBookingRequest) => {
    try {
      setLoading(true)
      setError(null)
      const updatedBooking = await api.bookings.update(id, updates)
      return updatedBooking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update booking'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getBooking = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const booking = await api.bookings.get(id)
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch booking'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createBooking,
    updateBooking,
    getBooking
  }
}

// hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// hooks/useApi.ts
import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null })
    
    try {
      const result = await apiCall()
      setState({ data: result, loading: false, error: null })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setState({ data: null, loading: false, error: errorMessage })
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}

// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
        const data = await api.clients.list()
        setClients(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch clients')
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  const createClient = async (clientData: Omit<Client, 'id'>) => {
    try {
      const newClient = await api.clients.create(clientData)
      setClients(prev => [...prev, newClient])
      return newClient
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create client')
    }
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const updatedClient = await api.clients.update(id, updates)
      setClients(prev => prev.map(client => client.id === id ? updatedClient : client))
      return updatedClient
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update client')
    }
  }

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient
  }
}

// hooks/useServices.ts
import { useState, useEffect } from 'react'
import { Service } from '@/types'
import { api } from '@/utils/api'

export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true)
        setError(null)
        const data = await api.services.list()
        setServices(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch services')
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const updateServicePrice = async (serviceId: string, price: number) => {
    try {
      const updatedService = await api.services.update(serviceId, { price })
      setServices(prev => prev.map(service => 
        service.id === serviceId ? { ...service, price } : service
      ))
      return updatedService
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update service price')
    }
  }

  return {
    services,
    loading,
    error,
    updateServicePrice
  }
}

// hooks/useStaff.ts
import { useState, useEffect } from 'react'
import { Staff } from '@/types'
import { api } from '@/utils/api'

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStaff() {
      try {
        setLoading(true)
        setError(null)
        