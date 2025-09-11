import { headers } from 'next/headers'

// Lightweight Builder.io content fetcher with smart caching for dev and prod
// Does not rely on Builder SDK to avoid extra dev-time overhead

const isProd = process.env.NODE_ENV === 'production'
const BUILDER_API_KEY = process.env.NEXT_PUBLIC_BUILDER_API_KEY || ''

// Simple in-memory cache for dev to avoid repeated network calls during HMR
// Persisted on the module/global scope across requests when possible
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
  return JSON.stringify({
    m: opts.model,
    u: opts.urlPath || '/',
    l: opts.locale || 'en',
    q: opts.query || {},
  })
}

export async function fetchBuilderContent<T = any>(opts: BuilderFetchOptions): Promise<T | null> {
  if (!BUILDER_API_KEY) return null

  const key = cacheKey(opts)
  const devTTL = 5_000 // 5s dev cache to make HMR snappy without stale content for long
  const prodTTL = (opts.revalidateSeconds ?? 60) * 1000
  const now = Date.now()

  // Memory cache (helps significantly in dev and also during prod SSR bursts)
  const cached = memCache.get(key)
  if (cached && cached.expires > now) return cached.data as T

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

  const revalidate = isProd ? opts.revalidateSeconds ?? 60 : 0
  const nextOpts = revalidate > 0 ? { next: { revalidate, tags: [
    'builder',
    `builder:model:${opts.model}`,
    `builder:path:${urlParam}`,
  ] } } : { cache: 'no-store' as const }

  const res = await fetch(apiUrl, {
    ...nextOpts,
    headers: {
      'X-Builder-Proxy-Host': host,
    },
  })

  if (!res.ok) return null
  const json = await res.json().catch(() => null) as { results?: T[] } | null
  const data = (json && Array.isArray(json.results) && json.results[0]) ? (json.results[0] as T) : null

  const ttl = isProd ? prodTTL : devTTL
  memCache.set(key, { data, expires: now + ttl })
  return data
}

export function clearBuilderMemoryCache() {
  memCache.clear()
}
