import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

function isMultiTenancyEnabled(): boolean {
  return String(process.env.MULTI_TENANCY_ENABLED).toLowerCase() === 'true'
}

function extractSubdomain(hostname: string | null): string | null {
  if (!hostname) return null
  const host = hostname.split(':')[0]
  const parts = host.split('.')
  if (parts.length < 3) return null
  const sub = parts[0]
  if (sub === 'www') return parts.length >= 4 ? parts[1] : null
  return sub || null
}

export type EffectiveOrgSettings = {
  locale: string
  name: string
  logoUrl?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  legalLinks?: Record<string, string> | null
}

export async function getEffectiveOrgSettingsFromHeaders(): Promise<EffectiveOrgSettings> {
  const h = await headers()
  const host = h.get('host') || null
  const tenantId = isMultiTenancyEnabled() ? extractSubdomain(host) : null

  const row = await prisma.organizationSettings.findFirst({
    where: tenantId ? { tenantId } : {},
    select: {
      defaultLocale: true,
      name: true,
      logoUrl: true,
      contactEmail: true,
      contactPhone: true,
      legalLinks: true,
      termsUrl: true,
      privacyUrl: true,
      refundUrl: true,
    },
  }).catch(() => null)

  return {
    locale: (row?.defaultLocale as string) || 'en',
    name: (row?.name as string) || 'Accounting Firm',
    logoUrl: (row?.logoUrl as string | null) ?? null,
    contactEmail: (row?.contactEmail as string | null) ?? null,
    contactPhone: (row?.contactPhone as string | null) ?? null,
    legalLinks: (row ? ({
      terms: (row.termsUrl as string | null) ?? (row.legalLinks?.terms ?? null),
      privacy: (row.privacyUrl as string | null) ?? (row.legalLinks?.privacy ?? null),
      refund: (row.refundUrl as string | null) ?? (row.legalLinks?.refund ?? null),
    }) : null) as Record<string, string> | null,
  }
}
