import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import * as Sentry from '@sentry/nextjs'
import { validateImportWithSchema } from '@/lib/settings/export'
import { OrganizationSettingsSchema } from '@/schemas/settings/organization'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { tenantFilter } from '@/lib/tenant'

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!hasPermission(ctx.role || undefined, PERMISSIONS.ORG_SETTINGS_IMPORT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const ip = getClientIp(req)
    const key = `org-settings:import:${ctx.tenantId}:${ip}`
    if (!rateLimit(key, 3, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const body = await req.json().catch(() => ({}))
    const data = validateImportWithSchema(body, OrganizationSettingsSchema)

    const existing = await prisma.organizationSettings.findFirst({ where: tenantFilter(ctx.tenantId) }).catch(() => null)
    const saveData: any = {
      tenantId: ctx.tenantId || undefined,
      name: data.general?.name ?? existing?.name ?? '',
      tagline: data.general?.tagline ?? existing?.tagline ?? null,
      description: data.general?.description ?? existing?.description ?? null,
      industry: data.general?.industry ?? existing?.industry ?? null,
      contactEmail: data.contact?.contactEmail ?? existing?.contactEmail ?? null,
      contactPhone: data.contact?.contactPhone ?? existing?.contactPhone ?? null,
      address: data.contact?.address ?? existing?.address ?? null,
      defaultTimezone: data.localization?.defaultTimezone ?? existing?.defaultTimezone ?? 'UTC',
      defaultCurrency: data.localization?.defaultCurrency ?? existing?.defaultCurrency ?? 'USD',
      defaultLocale: data.localization?.defaultLocale ?? existing?.defaultLocale ?? 'en',
      logoUrl: data.branding?.logoUrl ?? existing?.logoUrl ?? null,
      branding: data.branding?.branding ?? existing?.branding ?? null,
      legalLinks: data.branding?.legalLinks ?? existing?.legalLinks ?? null,
    }

    const saved = existing
      ? await prisma.organizationSettings.update({ where: { id: (existing as any).id }, data: saveData })
      : await prisma.organizationSettings.create({ data: saveData })

    try { await logAudit({ action: 'org-settings:import', actorId: ctx.userId, details: { tenantId: ctx.tenantId } }) } catch {}
    return NextResponse.json({ ok: true })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
    return NextResponse.json({ error: 'Failed to import organization settings' }, { status: 500 })
  }
})
