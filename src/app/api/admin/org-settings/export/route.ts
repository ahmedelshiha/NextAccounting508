import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'
import prisma from '@/lib/prisma'
import * as Sentry from '@sentry/nextjs'
import { buildExportBundle } from '@/lib/settings/export'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.ORG_SETTINGS_EXPORT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = getTenantFromRequest(req as any)
    const row = await prisma.organizationSettings.findFirst({ where: tenantFilter(tenantId) }).catch(() => null)
    const out = row ? {
      general: { name: row.name, tagline: row.tagline, description: row.description, industry: row.industry },
      contact: { contactEmail: row.contactEmail, contactPhone: row.contactPhone, address: row.address || {} },
      localization: { defaultTimezone: row.defaultTimezone, defaultCurrency: row.defaultCurrency, defaultLocale: row.defaultLocale },
      branding: { logoUrl: row.logoUrl, branding: row.branding || {}, legalLinks: row.legalLinks || {} },
    } : { general: { name: '', tagline: '', description: '', industry: '' } }
    return NextResponse.json(buildExportBundle('organization', out))
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to export organization settings' }, { status: 500 })
  }
}
