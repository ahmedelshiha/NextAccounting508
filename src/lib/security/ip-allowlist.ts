// CIDR-aware IP allowlist matcher for IPv4 with support for exact IPv4/IPv6 strings and wildcard "*".
// Note: IPv6 CIDR matching is not implemented; IPv6 addresses are matched by exact string.

function normalizeIp(ip: string): string {
  const s = String(ip || '').trim()
  // Handle IPv4-mapped IPv6 addresses like ::ffff:203.0.113.5
  const v4mapped = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/i)
  if (v4mapped) return v4mapped[1]
  return s
}

function isIPv4(ip: string): boolean {
  return /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(ip)
}

function ipv4ToInt(ip: string): number {
  const [a, b, c, d] = ip.split('.').map((x) => parseInt(x, 10))
  // Convert to unsigned 32-bit integer
  return (((a << 24) | (b << 16) | (c << 8) | d) >>> 0)
}

function inCidrIPv4(ip: string, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/')
  const bits = Math.max(0, Math.min(32, parseInt(bitsStr || '32', 10)))
  if (!isIPv4(ip) || !isIPv4(base)) return false
  const ipInt = ipv4ToInt(ip)
  const baseInt = ipv4ToInt(base)
  const mask = bits === 0 ? 0 : ((0xffffffff << (32 - bits)) >>> 0)
  return (ipInt & mask) === (baseInt & mask)
}

export function isIpAllowed(ipRaw: string, allowList: string[]): boolean {
  const ip = normalizeIp(ipRaw)
  if (!allowList || allowList.length === 0) return true

  for (const entryRaw of allowList) {
    const entry = entryRaw.trim()
    if (!entry) continue
    if (entry === '*') return true
    if (entry.includes('/')) {
      // CIDR match (IPv4 only)
      if (isIPv4(ip) && inCidrIPv4(ip, entry)) return true
      continue
    }
    // Exact match (works for IPv4 and IPv6)
    if (ip === normalizeIp(entry)) return true
  }
  return false
}

export default isIpAllowed
