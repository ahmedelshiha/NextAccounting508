type Bucket = { tokens: number; last: number }
const buckets = new Map<string, Bucket>()

export function getClientIp(req: Request): string {
  try {
    const r = req as unknown as { ip?: string; socket?: { remoteAddress?: string } }
    const ip = r?.ip ?? r?.socket?.remoteAddress
    const hdr =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-nf-client-connection-ip') ||
      req.headers.get('cf-connecting-ip') ||
      ''
    const first = hdr.split(',')[0]?.trim()
    return ip || first || 'anonymous'
  } catch {
    return 'anonymous'
  }
}

export function rateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now()
  const bucket = buckets.get(key) || { tokens: limit, last: now }
  const elapsed = now - bucket.last
  const refill = Math.floor(elapsed / windowMs) * limit
  if (refill > 0) {
    bucket.tokens = Math.min(limit, bucket.tokens + refill)
    bucket.last = now
  }
  if (bucket.tokens <= 0) {
    buckets.set(key, bucket)
    return false
  }
  bucket.tokens -= 1
  buckets.set(key, bucket)
  return true
}
