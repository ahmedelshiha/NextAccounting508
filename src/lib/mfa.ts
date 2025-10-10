import prisma from '@/lib/prisma'

// Basic Base32 implementation (RFC 4648) for TOTP secrets
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function toBase32(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31]
  return output
}

function fromBase32(input: string): Uint8Array {
  let bits = 0
  let value = 0
  const output: number[] = []
  for (const ch of input.toUpperCase().replace(/=+$/,'')) {
    const idx = ALPHABET.indexOf(ch)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Uint8Array.from(output)
}

function randomBytes(len: number): Uint8Array {
  const arr = new Uint8Array(len)
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 256)
  }
  return arr
}

export function generateTotpSecret(bytes = 20): { secret: string; uri: string } {
  const buf = randomBytes(bytes)
  const secret = toBase32(buf)
  const issuer = encodeURIComponent('Accounting Firm')
  const label = encodeURIComponent('Secure Login')
  const account = ''
  const uri = `otpauth://totp/${label}${account ? ':'+account : ''}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
  return { secret, uri }
}

// Minimal SHA-1 and HMAC-SHA1 implementations (synchronous, no Node/Edge crypto)
function sha1(bytes: Uint8Array): Uint8Array {
  // Based on public domain implementation
  function rotl(n: number, b: number) { return (n << b) | (n >>> (32 - b)) }
  const ml = bytes.length * 8
  const withOne = new Uint8Array(((bytes.length + 9 + 63) & ~63))
  withOne.set(bytes)
  withOne[bytes.length] = 0x80
  const dv = new DataView(withOne.buffer)
  dv.setUint32(withOne.length - 8, Math.floor(ml / 0x100000000))
  dv.setUint32(withOne.length - 4, ml >>> 0)
  let h0 = 0x67452301 | 0
  let h1 = 0xefcdab89 | 0
  let h2 = 0x98badcfe | 0
  let h3 = 0x10325476 | 0
  let h4 = 0xc3d2e1f0 | 0
  const w = new Uint32Array(80)
  for (let i = 0; i < withOne.length; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4)
    for (let j = 16; j < 80; j++) w[j] = rotl(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1)
    let a = h0, b = h1, c = h2, d = h3, e = h4
    for (let j = 0; j < 80; j++) {
      const f = j < 20 ? (b & c) | (~b & d)
        : j < 40 ? (b ^ c ^ d)
        : j < 60 ? (b & c) | (b & d) | (c & d)
        : (b ^ c ^ d)
      const k = j < 20 ? 0x5a827999 : j < 40 ? 0x6ed9eba1 : j < 60 ? 0x8f1bbcdc : 0xca62c1d6
      const temp = (rotl(a, 5) + f + e + k + w[j]) >>> 0
      e = d; d = c; c = rotl(b, 30) >>> 0; b = a; a = temp
    }
    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }
  const out = new Uint8Array(20)
  const outDv = new DataView(out.buffer)
  outDv.setUint32(0, h0)
  outDv.setUint32(4, h1)
  outDv.setUint32(8, h2)
  outDv.setUint32(12, h3)
  outDv.setUint32(16, h4)
  return out
}

function hmacSha1(key: Uint8Array, data: Uint8Array): Uint8Array {
  const blockSize = 64
  if (key.length > blockSize) key = sha1(key)
  const oKeyPad = new Uint8Array(blockSize)
  const iKeyPad = new Uint8Array(blockSize)
  oKeyPad.fill(0x5c); iKeyPad.fill(0x36)
  for (let i = 0; i < key.length; i++) { oKeyPad[i] ^= key[i]; iKeyPad[i] ^= key[i] }
  const inner = sha1(new Uint8Array([...iKeyPad, ...data]))
  return sha1(new Uint8Array([...oKeyPad, ...inner]))
}

export function totpCode(secret: string, timeStepSec = 30, digits = 6, t: number = Date.now()): string {
  const counter = Math.floor(t / 1000 / timeStepSec)
  const key = fromBase32(secret)
  const buf = new Uint8Array(8)
  let x = BigInt(counter)
  for (let i = 7; i >= 0; i--) { buf[i] = Number(x & 0xffn); x >>= 8n }
  const hmac = hmacSha1(key, buf)
  const offset = hmac[hmac.length - 1] & 0x0f
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff)
  const str = String(code % 10 ** digits).padStart(digits, '0')
  return str
}

export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const now = Date.now()
  token = String(token || '').replace(/\s+/g, '')
  for (let w = -window; w <= window; w++) {
    const t = now + w * 30_000
    if (totpCode(secret, 30, 6, t) === token) return true
  }
  return false
}

// Storage using VerificationToken table
const SECRET_PREFIX = 'mfa:secret:'
const BACKUP_PREFIX = 'mfa:backup:'

export async function getUserMfaSecret(userId: string): Promise<string | null> {
  const row = await prisma.verificationToken.findFirst({ where: { identifier: `${SECRET_PREFIX}${userId}` } }).catch(() => null)
  return row?.token || null
}

export async function setUserMfaSecret(userId: string, secret: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({ where: { identifier: `${SECRET_PREFIX}${userId}` } })
    await tx.verificationToken.create({ data: { identifier: `${SECRET_PREFIX}${userId}`, token: secret, expires: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000) } })
  })
}

export async function clearUserMfa(userId: string): Promise<void> {
  await prisma.verificationToken.deleteMany({ where: { OR: [ { identifier: `${SECRET_PREFIX}${userId}` }, { identifier: { startsWith: `${BACKUP_PREFIX}${userId}:` } } ] } })
}

export async function generateBackupCodes(userId: string, count = 5): Promise<string[]> {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const rb = randomBytes(5)
    codes.push(Array.from(rb).map(b => b.toString(16).padStart(2, '0')).join(''))
  }
  await prisma.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({ where: { identifier: { startsWith: `${BACKUP_PREFIX}${userId}:` } } })
    for (const code of codes) {
      await tx.verificationToken.create({ data: { identifier: `${BACKUP_PREFIX}${userId}:${code}`, token: code, expires: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000) } })
    }
  })
  return codes
}

export async function consumeBackupCode(userId: string, code: string): Promise<boolean> {
  const row = await prisma.verificationToken.findFirst({ where: { identifier: `${BACKUP_PREFIX}${userId}:${code}`, token: code } })
  if (!row) return false
  await prisma.verificationToken.delete({ where: { token: row.token } as any }).catch(() => {})
  return true
}
