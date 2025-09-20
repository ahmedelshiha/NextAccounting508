import useSWR from 'swr'
import { apiFetch } from '@/lib/api'

export type ServiceRequestsQuery = {
  page?: number
  limit?: number
  q?: string
  status?: string | 'ALL'
  priority?: string | 'ALL'
  type?: 'ALL' | 'REQUESTS' | 'APPOINTMENTS'
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
  const limit = params.limit ?? 10
  const q = params.q ?? ''
  const status = params.status ?? 'ALL'
  const priority = params.priority ?? 'ALL'
  const type = params.type ?? 'ALL'

  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('limit', String(limit))
  if (q) query.set('q', q)
  if (status !== 'ALL') query.set('status', status)
  if (priority !== 'ALL') query.set('priority', priority)
  if (type !== 'ALL') query.set('type', type === 'APPOINTMENTS' ? 'appointments' : 'requests')

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
