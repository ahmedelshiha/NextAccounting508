const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

function encUtf8(input: string): Uint8Array {
  return new TextEncoder().encode(input)
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  if (!hex || hex.length % 2 !== 0) return new Uint8Array()
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16)
  return arr
}

async function hmacSha256(keyRaw: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const subtle = (globalThis.crypto && globalThis.crypto.subtle) ? globalThis.crypto.subtle : null
  if (!subtle) throw new Error('WebCrypto not available')
  const key = await subtle.importKey('raw', keyRaw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  const sig = await subtle.sign('HMAC', key, data)
  return new Uint8Array(sig)
}

export async function signTenantCookie(tenantId: string, userId: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET || ''
  const payload = `${tenantId}:${userId}:${Date.now()}`
  const sig = await hmacSha256(encUtf8(secret), encUtf8(payload))
  const sigHex = bytesToHex(sig)
  return `${payload}.${sigHex}`
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyTenantCookie(signedCookie: string, expectedTenantId?: string | null, expectedUserId?: string | null): Promise<boolean> {
  try {
    if (!signedCookie) return false
    const parts = signedCookie.split('.')
    if (parts.length < 2) return false
    const signature = parts.pop() as string
    const payload = parts.join('.')
    const [tenantId, userId, timestampStr] = payload.split(':')
    if (!tenantId || !timestampStr) return false

    if (expectedTenantId && tenantId !== expectedTenantId) return false
    if (expectedUserId && userId && expectedUserId !== userId) return false

    const secret = process.env.NEXTAUTH_SECRET || ''
    const sig = await hmacSha256(encUtf8(secret), encUtf8(payload))
    const expectedSigHex = bytesToHex(sig)
    if (!timingSafeEqualHex(expectedSigHex, signature)) return false

    const ts = Number(timestampStr)
    if (Number.isNaN(ts)) return false
    if (Date.now() - ts > COOKIE_MAX_AGE_MS) return false

    return true
  } catch {
    return false
  }
}
