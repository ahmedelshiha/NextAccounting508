import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import { tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

const DATA_PATH = path.join(process.cwd(), 'src', 'app', 'admin', 'tasks', 'data', 'notifications.json')
const hasDb = !!process.env.NETLIFY_DATABASE_URL

function readSettings() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return { emailEnabled: false, emailFrom: '', webhookUrl: '', templates: [] }
  }
}

function writeSettings(s: any) {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
    fs.writeFileSync(DATA_PATH, JSON.stringify(s, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error('Failed to write notifications', e)
    return false
  }
}

export const GET = withTenantContext(async (request?: Request) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) {
    return respond.forbidden('Forbidden')
  }
  if (hasDb) {
    try {
      const tenantId = ctx.tenantId
      const row = await prisma.notificationSettings.findFirst({ where: tenantFilter(tenantId) })
      if (row) {
        return NextResponse.json({
          emailEnabled: row.emailEnabled,
          emailFrom: row.emailFrom || '',
          webhookUrl: row.webhookUrl || '',
          templates: row.templates || [],
          updatedAt: row.updatedAt.toISOString(),
          createdAt: row.createdAt.toISOString(),
        })
      }
    } catch (e) {
      console.error('DB read notifications failed, falling back to file', e)
    }
  }
  return NextResponse.json(readSettings())
})

export const PATCH = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) {
    return respond.forbidden('Forbidden')
  }
    const body = await request.json().catch(() => ({}))

    if (hasDb) {
      try {
        const tenantId = ctx.tenantId
        const existing = await prisma.notificationSettings.findFirst({ where: tenantFilter(tenantId) })
        const payload = {
          emailEnabled: !!body.emailEnabled,
          emailFrom: body.emailFrom ?? existing?.emailFrom ?? '',
          webhookUrl: body.webhookUrl ?? existing?.webhookUrl ?? '',
          templates: Array.isArray(body.templates) ? body.templates : (existing?.templates ?? []),
          ...(isMultiTenancyEnabled() && tenantId ? { tenantId } : {})
        } as any
        const row = existing
          ? await prisma.notificationSettings.update({ where: { id: existing.id }, data: payload })
          : await prisma.notificationSettings.create({ data: payload })
        return NextResponse.json({
          emailEnabled: row.emailEnabled,
          emailFrom: row.emailFrom || '',
          webhookUrl: row.webhookUrl || '',
          templates: row.templates || [],
          updatedAt: row.updatedAt.toISOString(),
          createdAt: row.createdAt.toISOString(),
        })
      } catch (e) {
        console.error('DB update notifications failed, falling back to file', e)
      }
    }

    const s = { ...readSettings(), ...body, updatedAt: new Date().toISOString() }
    writeSettings(s)
    return NextResponse.json(s)
  } catch (e) {
    console.error('Update notifications error', e)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
})
