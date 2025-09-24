"use client"

import useSWR, { SWRConfiguration, mutate as globalMutate } from "swr"
import { useEffect, useMemo } from "react"
import { useAdminRealtime } from "@/components/dashboard/realtime/RealtimeProvider"

export type UnifiedDataOptions<T> = {
  key: string
  params?: Record<string, string | number | boolean | undefined>
  events?: string[]
  revalidateOnEvents?: boolean
  parse?: (raw: any) => T
  initialData?: T
  swr?: SWRConfiguration
}

export function useUnifiedData<T = any>(opts: UnifiedDataOptions<T>) {
  const { key, params, events = ["all"], revalidateOnEvents = true, parse, initialData, swr } = opts

  // Normalize to an API path; accept absolute/relative keys
  const path = useMemo(() => {
    const base = key.startsWith("/") ? key : `/api/admin/${key}`
    if (!params || Object.keys(params).length === 0) return base
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue
      qs.set(k, String(v))
    }
    const q = qs.toString()
    return q ? `${base}?${q}` : base
  }, [key, JSON.stringify(params || {})])

  const { data: raw, error, isValidating, mutate } = useSWR(path, undefined, {
    fallbackData: initialData as any,
    revalidateOnFocus: false,
    ...(swr || {})
  })

  const data = useMemo(() => (parse ? parse(raw) : (raw as T)), [raw, parse])
  const isLoading = !error && (raw === undefined)

  // Revalidate when relevant realtime events arrive
  try {
    const { subscribeByTypes } = useAdminRealtime()
    useEffect(() => {
      if (!revalidateOnEvents) return
      return subscribeByTypes(events, () => { void mutate() })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(events), revalidateOnEvents, path])
  } catch {
    // If provider not mounted, allow hook to be used without realtime
  }

  return { data, error, isLoading, isValidating, refresh: () => mutate(), mutate: (v?: any) => mutate(v, { revalidate: true }), key: path, globalMutate }
}
