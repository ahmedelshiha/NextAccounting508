import { headers } from 'next/headers'
import { cacheGet, cacheSet } from '@/lib/cache'
import { logInfo, logWarn } from '@/lib/log'

const isProd = process.env.NODE_ENV === 'production'
const BUILDER_API_KEY = process.env.NEXT_PUBLIC_BUILDER_API_KEY || ''

const g = globalThis as unknown as { __builderCache?: Map<string, { data: any; expires: number }> }
if (!g.__builderCache) g.__builderCache = new Map()
const memCache = g.__builderCache

export type BuilderFetchOptions = {
  model: string
  urlPath?: string
  query?: Record<string, unknown>
  locale?: string
  revalidateSeconds?: number
}

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    usp.set(k, String(v))
  }
  return usp.toString()
}

function cacheKey(opts: BuilderFetchOptions) {
  return JSON.stringify({ m: opts.model, u: opts.urlPath || '/', l: opts.locale || 'en', q: opts.query || {} })
}

export async function fetchBuilderContent<T = any>(opts: BuilderFetchOptions): Promise<T | null> {
  if (!BUILDER_API_KEY) {
    logWarn('builder.fetch.missing_key', { model: opts.model, path: opts.urlPath })
    return null
  }

  const key = `builder:${cacheKey(opts)}`
  const devTTLms = 5_000
  const prodTTLsec = opts.revalidateSeconds ?? 60
  const now = Date.now()

  const m = memCache.get(key)
  if (m && m.expires > now) return m.data as T

  const dist = await cacheGet<T>(key)
  if (dist != null) {
    memCache.set(key, { data: dist, expires: now + devTTLms })
    return dist
  }

  const hp = headers()
  const host = hp.get('host') || ''
  const urlParam = opts.urlPath || '/'

  const params = buildQuery({
    apiKey: BUILDER_API_KEY,
    'userAttributes.urlPath': urlParam,
    includeRefs: false,
    noTraverse: true,
    cachebust: isProd ? false : true,
    ...(opts.locale ? { 'userAttributes.locale': opts.locale } : {}),
  })

  const apiUrl = `https://cdn.builder.io/api/v3/content/${encodeURIComponent(opts.model)}?${params}`
  const revalidate = isProd ? prodTTLsec : 0
  const nextOpts = revalidate > 0 ? { next: { revalidate, tags: ['builder', `builder:model:${opts.model}`, `builder:path:${urlParam}`] } } : { cache: 'no-store' as const }

  const t0 = Date.now()
  const res = await fetch(apiUrl, { ...nextOpts, headers: { 'X-Builder-Proxy-Host': host } })
  const dur = Date.now() - t0
  try { (await import('@/lib/metrics')).recordMetric('builder_fetch_ms', dur) } catch {}

  if (!res.ok) {
    logWarn('builder.fetch.error', { status: res.status, url: apiUrl, dur })
    return null
  }

  const json = await res.json().catch(() => null) as { results?: T[] } | null
  const data = (json && Array.isArray(json.results) && json.results[0]) ? (json.results[0] as T) : null

  memCache.set(key, { data, expires: now + devTTLms })
  if (isProd) await cacheSet(key, data, prodTTLsec)
  logInfo('builder.fetch.ok', { model: opts.model, dur, cached: false })
  return data
}

export function clearBuilderMemoryCache() {
  memCache.clear()
}
