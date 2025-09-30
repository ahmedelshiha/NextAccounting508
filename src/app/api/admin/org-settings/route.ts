import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'
import { OrganizationSettingsSchema } from '@/schemas/settings/organization'
import { logAudit } from '@/lib/audit'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const row = await prisma.organizationSettings.findFirst({ where: tenantFilter(tenantId) }).catch(() => null)
  if (!row) return NextResponse.json({ name: '', tagline: '', description: '', industry: '' })
  // Normalize to expected shape
  const out = {
    general: { name: row.name, tagline: row.tagline, description: row.description, industry: row.industry },
    contact: { contactEmail: row.contactEmail, contactPhone: row.contactPhone, address: row.address || {} },
    localization: { defaultTimezone: row.defaultTimezone, defaultCurrency: row.defaultCurrency, defaultLocale: row.defaultLocale },
    branding: { logoUrl: row.logoUrl, branding: row.branding || {}, legalLinks: row.legalLinks || {} }
  }
  return NextResponse.json(out)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(() => ({}))
  const parsed = OrganizationSettingsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  const existing = await prisma.organizationSettings.findFirst({ where: tenantFilter(tenantId) }).catch(() => null)

  const data: any = {
    tenantId: tenantId || undefined,
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
    legalLinks: parsed.data.branding?.legalLinks ?? existing?.legalLinks ?? null,
  }

  const saved = existing
    ? await prisma.organizationSettings.update({ where: { id: existing.id }, data })
    : await prisma.organizationSettings.create({ data })

  try { await logAudit({ action: 'org-settings:update', actorId: session.user.id, details: { tenantId } }) } catch {}

  return NextResponse.json({ ok: true, settings: saved })
}
