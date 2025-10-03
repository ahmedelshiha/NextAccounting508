import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, getResolvedTenantId, tenantFilter, withTenant } from '@/lib/tenant'
import { OrganizationSettingsSchema } from '@/schemas/settings/organization'
import { logAudit } from '@/lib/audit'
import * as Sentry from '@sentry/nextjs'


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.ORG_SETTINGS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const requestedTenantId = getTenantFromRequest(req as any)
    const tenantId = await getResolvedTenantId(requestedTenantId ?? req)
    const scopedFilter = tenantFilter(tenantId)
    const scope = Object.keys(scopedFilter).length > 0 ? scopedFilter : { tenantId }
    const row = await prisma.organizationSettings.findFirst({ where: scope }).catch(() => null)
    if (!row) return NextResponse.json({ name: '', tagline: '', description: '', industry: '' })

    const out = {
      general: { name: row.name, tagline: row.tagline, description: row.description, industry: row.industry },
      contact: { contactEmail: row.contactEmail, contactPhone: row.contactPhone, address: row.address || {} },
      localization: { defaultTimezone: row.defaultTimezone, defaultCurrency: row.defaultCurrency, defaultLocale: row.defaultLocale },
      branding: {
        logoUrl: row.logoUrl,
        branding: row.branding || {},
        // Use explicit URL columns
        termsUrl: row.termsUrl ?? null,
        privacyUrl: row.privacyUrl ?? null,
        refundUrl: row.refundUrl ?? null,
        // Provide normalized object for clients
        legalLinks: { terms: row.termsUrl ?? null, privacy: row.privacyUrl ?? null, refund: row.refundUrl ?? null }
      }
    }
    return NextResponse.json(out)
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to load organization settings' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.ORG_SETTINGS_EDIT)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const requestedTenantId = getTenantFromRequest(req as any)
  const tenantId = await getResolvedTenantId(requestedTenantId ?? req)
  const body = await req.json().catch(() => ({}))
  const parsed = OrganizationSettingsSchema.safeParse(body)
  if (!parsed.success) {
    try { Sentry.captureMessage('org-settings:validation_failed', { level: 'warning' } as any) } catch {}
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  }
  const scopedFilter = tenantFilter(tenantId)
  const scope = Object.keys(scopedFilter).length > 0 ? scopedFilter : { tenantId }
  const existing = await prisma.organizationSettings.findFirst({ where: scope }).catch(() => null)

  const data = withTenant({
    name: parsed.data.general?.name ?? existing?.name ?? '',
    tagline: parsed.data.general?.tagline ?? existing?.tagline ?? null,
    description: parsed.data.general?.description ?? existing?.description ?? null,
    industry: parsed.data.general?.industry ?? existing?.industry ?? null,
    contactEmail: parsed.data.contact?.contactEmail ?? existing?.contactEmail ?? null,
    contactPhone: parsed.data.contact?.contactPhone ?? existing?.contactPhone ?? null,
    address: parsed.data.contact?.address ?? existing?.address ?? null,
    defaultTimezone: parsed.data.localization?.defaultTimezone ?? existing?.defaultTimezone ?? 'UTC',
    defaultCurrency: parsed.data.localization?.defaultCurrency ?? existing?.defaultCurrency ?? 'USD',
    defaultLocale: parsed.data.localization?.defaultLocale ?? existing?.defaultLocale ?? 'en',
    logoUrl: parsed.data.branding?.logoUrl ?? existing?.logoUrl ?? null,
    branding: parsed.data.branding?.branding ?? existing?.branding ?? null,
    // Save explicit URL fields if provided (new columns)
    termsUrl:
      parsed.data.branding?.termsUrl ??
      (parsed.data.branding?.legalLinks?.terms ?? existing?.termsUrl ?? null),
    privacyUrl:
      parsed.data.branding?.privacyUrl ??
      (parsed.data.branding?.legalLinks?.privacy ?? existing?.privacyUrl ?? null),
    refundUrl:
      parsed.data.branding?.refundUrl ??
      (parsed.data.branding?.legalLinks?.refund ?? existing?.refundUrl ?? null),
    // Stop persisting legacy JSON blob
    legalLinks: null,
  }, tenantId)

  try {
    const saved = existing
      ? await prisma.organizationSettings.update({ where: { id: existing.id }, data })
      : await prisma.organizationSettings.create({ data })

    try {
      await logAudit({
        action: 'org-settings:update',
        actorId: session.user.id,
        details: { tenantId, requestedTenantId: requestedTenantId ?? null },
      })
    } catch {}

    return NextResponse.json({ ok: true, settings: saved })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 })
  }
}
