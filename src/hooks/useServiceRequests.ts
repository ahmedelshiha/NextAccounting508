import useSWR from 'swr'
import { apiFetch } from '@/lib/api'

export type ServiceRequestsQuery = {
  page?: number
  offset?: number
  limit?: number
  q?: string
  status?: string | 'ALL'
  priority?: string | 'ALL'
  bookingType?: 'STANDARD' | 'RECURRING' | 'EMERGENCY' | 'CONSULTATION' | 'ALL'
  dateFrom?: string
  dateTo?: string
  type?: 'ALL' | 'REQUESTS' | 'APPOINTMENTS'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type ServiceRequestsResponse<T = any> = {
  success?: boolean
  data?: T[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
  error?: string
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  const json = await res.json().catch(() => ({}))
  return json as ServiceRequestsResponse
}

export function useServiceRequests(params: ServiceRequestsQuery = {}) {
  const page = params.page ?? 1
  const offset = params.offset
  const limit = params.limit ?? 10
  const q = params.q ?? ''
  const status = params.status ?? 'ALL'
  const priority = params.priority ?? 'ALL'
  const bookingType = params.bookingType ?? 'ALL'
  const dateFrom = params.dateFrom
  const dateTo = params.dateTo
  const type = params.type ?? 'ALL'
  const sortBy = params.sortBy
  const sortOrder = params.sortOrder

  const query = new URLSearchParams()
  query.set('limit', String(limit))
  if (typeof offset === 'number') {
    query.set('offset', String(Math.max(0, Math.floor(offset))))
  } else {
    query.set('page', String(page))
  }
  if (q) query.set('q', q)
  if (status !== 'ALL') query.set('status', status)
  if (priority !== 'ALL') query.set('priority', priority)
  if (bookingType !== 'ALL') query.set('bookingType', bookingType)
  if (dateFrom) query.set('dateFrom', dateFrom)
  if (dateTo) query.set('dateTo', dateTo)
  if (type !== 'ALL') query.set('type', type === 'APPOINTMENTS' ? 'appointments' : 'requests')
  if (sortBy) query.set('sortBy', sortBy)
  if (sortOrder) query.set('sortOrder', sortOrder)

  const key = `/api/admin/service-requests?${query.toString()}`
  const { data, isLoading, error, mutate } = useSWR<ServiceRequestsResponse>(key, fetcher)

  return {
    items: data?.data ?? [],
    pagination: data?.pagination ?? { page, limit, total: 0, totalPages: 1 },
    isLoading,
    error,
    refresh: () => mutate(),
  }
}
