type Json = any

const isProd = process.env.NODE_ENV === 'production'
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || ''
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || ''

const g = globalThis as unknown as { __mem?: Map<string, { v: Json; exp: number }> }
if (!g.__mem) g.__mem = new Map()
const mem = g.__mem

async function redisGet(k: string): Promise<Json | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(k)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const out = await res.json().catch(() => null) as { result?: string } | null
    if (!out?.result) return null
    return JSON.parse(out.result)
  } catch {
    return null
  }
}

async function redisSet(k: string, v: Json, ttlSec: number): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return
  try {
    await fetch(`${UPSTASH_URL}/set/${encodeURIComponent(k)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: JSON.stringify(v), EX: ttlSec }),
    })
  } catch {
    // ignore
  }
}

export async function cacheGet<T = Json>(key: string): Promise<T | null> {
  const now = Date.now()
  const m = mem.get(key)
  if (m && m.exp > now) return m.v as T
  const r = await redisGet(key)
  if (r != null) return r as T
  return null
}

export async function cacheSet<T = Json>(key: string, value: T, ttlSec: number): Promise<void> {
  const exp = Date.now() + ttlSec * 1000
  mem.set(key, { v: value as Json, exp })
  if (isProd) await redisSet(key, value as Json, ttlSec)
}

export function cacheDel(key: string) {
  mem.delete(key)
}
