// CIDR-aware IP allowlist matcher for IPv4 and IPv6 with support for exact IPv4/IPv6 strings and wildcard "*".
// Supports IPv4-mapped IPv6 addresses like ::ffff:203.0.113.5

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

// IPv6 utilities
function isIPv6(ip: string): boolean {
  // Simple heuristic: contains ':' and not an IPv4
  return typeof ip === 'string' && ip.includes(':') && !isIPv4(ip)
}

function expandIPv6(address: string): string | null {
  // Expand zero-compressed IPv6 (::) and return full 8 groups
  if (!address) return null
  // Remove zone id if present
  const zoneIndex = address.indexOf('%')
  if (zoneIndex !== -1) address = address.slice(0, zoneIndex)

  // If contains IPv4 tail, split and convert last 32 bits to hex groups
  const ipv4TailMatch = address.match(/(.+):(?:(\d+\.\d+\.\d+\.\d+))$/)
  let ipv4Tail: string | null = null
  if (ipv4TailMatch) {
    address = ipv4TailMatch[1]
    ipv4Tail = ipv4TailMatch[2]
  }

  const parts = address.split('::')
  if (parts.length > 2) return null

  const left = parts[0] ? parts[0].split(':').filter(Boolean) : []
  const right = parts[1] ? parts[1].split(':').filter(Boolean) : []

  let midFill = 8 - (left.length + right.length)
  if (ipv4Tail) midFill -= 2 // IPv4 tail occupies 2 groups
  if (midFill < 0) return null

  const groups: string[] = []
  groups.push(...left)
  for (let i = 0; i < (parts.length === 1 ? 0 : midFill); i++) groups.push('0')
  groups.push(...right)

  if (ipv4Tail) {
    const octets = ipv4Tail.split('.').map((n) => parseInt(n, 10))
    if (octets.length !== 4 || octets.some((n) => Number.isNaN(n))) return null
    const high = ((octets[0] << 8) | octets[1]) >>> 0
    const low = ((octets[2] << 8) | octets[3]) >>> 0
    groups.push((high).toString(16))
    groups.push((low).toString(16))
  }

  // If no :: present and we ended up with less or more than 8 groups, fail
  if (groups.length !== 8) {
    // Attempt case where original had no :: but groups already 8
    const raw = address.split(':').filter(Boolean)
    if (raw.length === 8 && !ipv4Tail) return raw.map(g => g.padStart(4,'0')).join(':')
    return null
  }

  return groups.map((g) => g.padStart(4, '0')).join(':')
}

function ipv6ToBigInt(ip: string): bigint | null {
  const expanded = expandIPv6(ip)
  if (!expanded) return null
  const parts = expanded.split(':')
  if (parts.length !== 8) return null
  let result = 0n
  for (const part of parts) {
    const val = BigInt(parseInt(part, 16) & 0xffff)
    result = (result << 16n) | val
  }
  return result
}

function inCidrIPv6(ip: string, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/')
  const bits = Math.max(0, Math.min(128, parseInt(bitsStr || '128', 10)))
  if (!isIPv6(ip)) return false
  const ipBig = ipv6ToBigInt(ip)
  const baseBig = ipv6ToBigInt(base)
  if (ipBig === null || baseBig === null) return false
  if (bits === 0) return true
  const shift = 128n - BigInt(bits)
  const mask = (((1n << BigInt(bits)) - 1n) << shift) & ((1n << 128n) - 1n)
  return (ipBig & mask) === (baseBig & mask)
}

export function isIpAllowed(ipRaw: string, allowList: string[]): boolean {
  const ip = normalizeIp(ipRaw)
  if (!allowList || allowList.length === 0) return true

  for (const entryRaw of allowList) {
    const entry = entryRaw.trim()
    if (!entry) continue
    if (entry === '*') return true
    if (entry.includes('/')) {
      // CIDR match (IPv4 or IPv6)
      if (isIPv4(ip) && inCidrIPv4(ip, entry)) return true
      if (isIPv6(ip) && inCidrIPv6(ip, entry)) return true
      continue
    }
    // Exact match (works for IPv4 and IPv6)
    if (ip === normalizeIp(entry)) return true
  }
  return false
}

export default isIpAllowed
