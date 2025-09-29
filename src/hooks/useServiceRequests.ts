import useSWR from 'swr'
import { apiFetch } from '@/lib/api'

export type ServiceRequestsQuery = {
  page?: number
  offset?: number
  limit?: number
  q?: string
  status?: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ALL'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'ALL'
  assignedTo?: string
  clientId?: string
  serviceId?: string
  dateFrom?: string
  dateTo?: string
  scope?: 'admin' | 'portal'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  type?: 'all' | 'appointments' | 'requests'
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
  const assignedTo = params.assignedTo
  const clientId = params.clientId
  const serviceId = params.serviceId
  const dateFrom = params.dateFrom
  const dateTo = params.dateTo
  const scope = params.scope ?? 'admin'
  const sortBy = params.sortBy
  const sortOrder = params.sortOrder
  const type = (params as any).type

  const query = new URLSearchParams()
  query.set('limit', String(limit))
  if (typeof offset === 'number') {
    query.set('offset', String(Math.max(0, Math.floor(offset))))
  } else {
    const computed = Math.max(0, (page - 1) * limit)
    query.set('offset', String(computed))
  }
  query.set('page', String(page))
  if (q) query.set('q', q)
  if (status !== 'ALL') query.set('status', status)
  if (priority !== 'ALL') query.set('priority', priority)
  if (assignedTo) query.set('assignedTo', assignedTo)
  if (clientId) query.set('clientId', clientId)
  if (serviceId) query.set('serviceId', serviceId)
  if (dateFrom) query.set('dateFrom', dateFrom)
  if (dateTo) query.set('dateTo', dateTo)
  if (sortBy) query.set('sortBy', sortBy)
  if (sortOrder) query.set('sortOrder', sortOrder)
  if (type && ['all','appointments','requests'].includes(String(type))) {
    if (type !== 'all') query.set('type', String(type))
  }

  const base = scope === 'portal' ? '/api/portal/service-requests' : '/api/admin/service-requests'
  const key = `${base}?${query.toString()}`
  const { data, isLoading, error, mutate } = useSWR<ServiceRequestsResponse>(key, fetcher)

  return {
    items: data?.data ?? [],
    pagination: data?.pagination ?? { page, limit, total: 0, totalPages: 1 },
    isLoading,
    error,
    refresh: () => mutate(),
  }
}
