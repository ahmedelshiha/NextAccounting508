import { NextResponse } from 'next/server'
import { getEffectiveOrgSettingsFromHeaders } from '@/lib/org-settings'
import { withTenantContext } from '@/lib/api-wrapper'

export const GET = withTenantContext(async () => {
  try {
    const eff = await getEffectiveOrgSettingsFromHeaders()
    return NextResponse.json({
      name: eff.name,
      logoUrl: eff.logoUrl || null,
      contactEmail: eff.contactEmail || null,
      contactPhone: eff.contactPhone || null,
      legalLinks: eff.legalLinks || null,
      defaultLocale: eff.locale || 'en',
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load public org settings' }, { status: 500 })
  }
}, { requireAuth: false })
