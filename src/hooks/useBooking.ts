import useSWR from 'swr'
import useSWR from 'swr'
import { apiFetch } from '@/lib/api'

export function useBooking(id?: string, scope: 'admin' | 'portal' = 'admin') {
  const base = scope === 'portal' ? '/api/portal/service-requests' : '/api/admin/service-requests'
  const key = id ? `${base}/${id}` : null
  const fetcher = async (url: string) => {
    const res = await apiFetch(url)
    const json = await res.json().catch(() => ({}))
    return json as { success?: boolean; data?: any; error?: string }
  }
  const { data, isLoading, error, mutate } = useSWR(key, fetcher)

  return {
    item: (data as any)?.data ?? null,
    isLoading,
    error,
    refresh: () => mutate(),
  }
}
