import useSWR from 'swr'
import { apiFetch } from '@/lib/api'

export type BookingsQuery = {
  page?: number
  limit?: number
  q?: string
  status?: string | 'ALL'
  priority?: string | 'ALL'
  bookingType?: 'STANDARD' | 'RECURRING' | 'EMERGENCY' | 'CONSULTATION' | 'ALL'
  dateFrom?: string
  dateTo?: string
  teamMemberId?: string
  type?: 'appointments' | 'requests' | 'all'
  scope?: 'admin' | 'portal'
}

export type BookingsResponse<T = any> = {
  success?: boolean
  data?: T[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
  error?: string
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  const json = await res.json().catch(() => ({}))
  return json as BookingsResponse
}

export function useBookings(params: BookingsQuery = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10
  const q = params.q ?? ''
  const status = params.status ?? 'ALL'
  const bookingType = params.bookingType ?? 'ALL'
  const priority = params.priority ?? 'ALL'
  const dateFrom = params.dateFrom
  const dateTo = params.dateTo
  const teamMemberId = params.teamMemberId
  const type = params.type ?? 'all'
  const scope = params.scope ?? 'admin'

  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('limit', String(limit))
  if (q) query.set('q', q)
  if (status !== 'ALL') query.set('status', status)
  if (priority !== 'ALL') query.set('priority', priority)
  if (bookingType !== 'ALL') query.set('bookingType', bookingType)
  if (dateFrom) query.set('dateFrom', dateFrom)
  if (dateTo) query.set('dateTo', dateTo)
  if (teamMemberId) query.set('teamMemberId', teamMemberId)

  let base = scope === 'portal' ? '/api/portal/service-requests' : '/api/admin/service-requests'
  if (type && type !== 'all') query.set('type', type)

  const key = `${base}?${query.toString()}`
  const { data, isLoading, error, mutate } = useSWR<BookingsResponse>(key, fetcher)

  // Fallback client-side filter for portal when backend lacks type filter
  const itemsRaw = data?.data ?? []
  const items = scope === 'portal' && type === 'appointments'
    ? itemsRaw.filter((it: any) => (it?.isBooking === true) || !!(it as any)?.scheduledAt)
    : itemsRaw

  return {
    items,
    pagination: data?.pagination ?? { page, limit, total: items.length, totalPages: 1 },
    isLoading,
    error,
    refresh: () => mutate(),
  }
}
