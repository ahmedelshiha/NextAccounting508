import crypto from 'crypto'
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

export function generateTotpSecret(bytes = 20): { secret: string; uri: string } {
  const buf = crypto.randomBytes(bytes)
  const secret = toBase32(buf)
  const issuer = encodeURIComponent('Accounting Firm')
  const label = encodeURIComponent('Secure Login')
  const account = ''
  const uri = `otpauth://totp/${label}${account ? ':'+account : ''}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
  return { secret, uri }
}

export function totpCode(secret: string, timeStepSec = 30, digits = 6, t: number = Date.now()): string {
  const counter = Math.floor(t / 1000 / timeStepSec)
  const key = fromBase32(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = crypto.createHmac('sha1', Buffer.from(key)).update(buf).digest()
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
  for (let i = 0; i < count; i++) codes.push(crypto.randomBytes(5).toString('hex'))
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
