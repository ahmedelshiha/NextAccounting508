import crypto from 'crypto'

const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

export function signTenantCookie(tenantId: string, userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || ''
  const payload = `${tenantId}:${userId}:${Date.now()}`
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const sig = hmac.digest('hex')
  return `${payload}.${sig}`
}

export function verifyTenantCookie(signedCookie: string, expectedTenantId?: string | null, expectedUserId?: string | null): boolean {
  try {
    if (!signedCookie) return false
    const parts = signedCookie.split('.')
    if (parts.length < 2) return false
    const signature = parts.pop() as string
    const payload = parts.join('.')
    const [tenantId, userId, timestampStr] = payload.split(':')
    if (!tenantId || !timestampStr) return false

    // Optional tenant/user checks
    if (expectedTenantId && tenantId !== expectedTenantId) return false
    if (expectedUserId && userId && expectedUserId !== userId) return false

    const secret = process.env.NEXTAUTH_SECRET || ''
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const expectedSig = hmac.digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(expectedSig, 'hex'), Buffer.from(signature, 'hex'))) return false

    const ts = Number(timestampStr)
    if (Number.isNaN(ts)) return false
    if (Date.now() - ts > COOKIE_MAX_AGE_MS) return false

    return true
  } catch (err) {
    return false
  }
}
