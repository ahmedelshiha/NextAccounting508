import { NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import isIpAllowed from '@/lib/security/ip-allowlist'
import securityService from '@/services/security-settings.service'
import { withTenantContext } from '@/lib/api-wrapper'

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ip = getClientIp(request)
    const family = ip.includes(':') ? 'ipv6' : 'ipv4'

    // Load tenant-level network allowlist (use default if unavailable)
    const settings = await securityService.get(null).catch(() => null)
    const allowList: string[] = (settings && settings.network && Array.isArray(settings.network.ipAllowlist)) ? settings.network.ipAllowlist : []

    const allowed = isIpAllowed(ip, allowList)
    // Find matched rule if any
    let matched: string | null = null
    for (const entry of allowList) {
      if (!entry) continue
      if (isIpAllowed(ip, [entry])) { matched = entry; break }
    }

    return NextResponse.json({ ip, family, allowed, matched })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to resolve client ip' }, { status: 500 })
  }
})
