import useSWR from 'swr'
import { apiFetch } from '@/lib/api'

export type BookingsQuery = {
  page?: number
  offset?: number
  limit?: number
  q?: string
  status?: string | 'ALL'
  priority?: string | 'ALL'
  bookingType?: 'STANDARD' | 'RECURRING' | 'EMERGENCY' | 'CONSULTATION' | 'ALL'
  paymentStatus?: 'UNPAID'|'INTENT'|'PAID'|'FAILED'|'REFUNDED'|'ALL'
  dateFrom?: string
  dateTo?: string
  teamMemberId?: string
  type?: 'appointments' | 'requests' | 'all'
  scope?: 'admin' | 'portal'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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
  const offset = params.offset
  const limit = params.limit ?? 10
  const q = params.q ?? ''
  const status = params.status ?? 'ALL'
  const bookingType = params.bookingType ?? 'ALL'
  const priority = params.priority ?? 'ALL'
  const paymentStatus = params.paymentStatus ?? 'ALL'
  const dateFrom = params.dateFrom
  const dateTo = params.dateTo
  const teamMemberId = params.teamMemberId
  const type = params.type ?? 'all'
  const scope = params.scope ?? 'admin'
  const sortBy = params.sortBy
  const sortOrder = params.sortOrder

  const query = new URLSearchParams()
  query.set('limit', String(limit))
  if (typeof offset === 'number') {
    query.set('offset', String(Math.max(0, Math.floor(offset))))
  } else {
    const computed = Math.max(0, (page - 1) * limit)
    query.set('offset', String(computed))
  }
  // Keep page for backward compatibility with any legacy handlers
  query.set('page', String(page))
  if (q) query.set('q', q)
  if (status !== 'ALL') query.set('status', status)
  if (priority !== 'ALL') query.set('priority', priority)
  if (bookingType !== 'ALL') query.set('bookingType', bookingType)
  if (paymentStatus !== 'ALL') query.set('paymentStatus', paymentStatus)
  if (dateFrom) query.set('dateFrom', dateFrom)
  if (dateTo) query.set('dateTo', dateTo)
  if (teamMemberId) query.set('teamMemberId', teamMemberId)

  const base = scope === 'portal' ? '/api/portal/service-requests' : '/api/admin/service-requests'
  if (type && type !== 'all') query.set('type', type)
  if (sortBy) query.set('sortBy', sortBy)
  if (sortOrder) query.set('sortOrder', sortOrder)

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
