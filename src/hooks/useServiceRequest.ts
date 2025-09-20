import useSWR from 'swr'
import { apiFetch } from '@/lib/api'

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  const json = await res.json().catch(() => ({}))
  return json as { success?: boolean; data?: any; error?: string }
}

export function useServiceRequest(id?: string) {
  const key = id ? `/api/admin/service-requests/${id}` : null
  const { data, isLoading, error, mutate } = useSWR(key, fetcher)

  return {
    item: (data as any)?.data ?? null,
    isLoading,
    error,
    refresh: () => mutate(),
  }
}
