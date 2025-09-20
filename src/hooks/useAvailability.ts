import useSWR from 'swr'
import { apiFetch } from '@/lib/api'

type Params = {
  serviceId?: string
  dateFrom?: string
  dateTo?: string
  duration?: number
  teamMemberId?: string
}

type AvailabilityResponse = { success?: boolean; data?: { slots: { start: string; end: string; available: boolean }[] } }

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  const json = await res.json().catch(() => ({}))
  return json as AvailabilityResponse
}

export function useAvailability(params: Params) {
  const { serviceId, dateFrom, dateTo, duration, teamMemberId } = params
  const query = new URLSearchParams()
  if (serviceId) query.set('serviceId', serviceId)
  if (dateFrom) query.set('dateFrom', dateFrom)
  if (dateTo) query.set('dateTo', dateTo)
  if (duration) query.set('duration', String(duration))
  if (teamMemberId) query.set('teamMemberId', teamMemberId)

  const key = serviceId && dateFrom && dateTo ? `/api/admin/service-requests/availability?${query.toString()}` : null
  const { data, isLoading, error, mutate } = useSWR<AvailabilityResponse>(key, fetcher)

  return {
    slots: data?.data?.slots ?? [],
    isLoading,
    error,
    refresh: () => mutate(),
  }
}
