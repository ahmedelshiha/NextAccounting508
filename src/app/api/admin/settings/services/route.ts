import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'admin-settings-services.json')

const ServicesSettingsSchema = z.object({
  defaultCategory: z.string().optional(),
  defaultCurrency: z.string().optional(),
  allowCloning: z.boolean().optional(),
  featuredToggleEnabled: z.boolean().optional(),
  priceRounding: z.number().int().min(0).max(6).optional(),
  defaultRequestStatus: z.string().optional(),
  autoAssign: z.boolean().optional(),
  autoAssignStrategy: z.string().optional(),
  allowConvertToBooking: z.boolean().optional(),
  defaultBookingType: z.string().optional(),
})

function jsonResponse(payload: any, status = 200) {
  return new NextResponse(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function readSettingsFile() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return null
    const raw = await fs.promises.readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

async function writeSettingsFile(obj: any) {
  try {
    const dir = path.dirname(SETTINGS_FILE)
    await fs.promises.mkdir(dir, { recursive: true })
    await fs.promises.writeFile(SETTINGS_FILE, JSON.stringify(obj, null, 2), 'utf-8')
    return true
  } catch (e) {
    return false
  }
}

const DEFAULTS = {
  defaultCategory: 'General',
  defaultCurrency: 'USD',
  allowCloning: true,
  featuredToggleEnabled: true,
  priceRounding: 2,
  defaultRequestStatus: 'SUBMITTED',
  autoAssign: true,
  autoAssignStrategy: 'round_robin',
  allowConvertToBooking: true,
  defaultBookingType: 'STANDARD',
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) return jsonResponse({ ok: false, error: 'Unauthorized' }, 401)
    const role = (session.user as any)?.role as string | undefined
    if (!hasPermission(role, PERMISSIONS.SERVICES_VIEW)) return jsonResponse({ ok: false, error: 'Forbidden' }, 403)

    const stored = await readSettingsFile()
    const result = { ok: true, data: Object.assign({}, DEFAULTS, stored || {}) }
    return jsonResponse(result)
  } catch (e: any) {
    return jsonResponse({ ok: false, error: String(e?.message || 'Unknown error') }, 500)
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) return jsonResponse({ ok: false, error: 'Unauthorized' }, 401)
    const role = (session.user as any)?.role as string | undefined
    // require edit permission - ADMIN or SERVICES_VIEW works as baseline
    if (!hasPermission(role, PERMISSIONS.SERVICES_VIEW)) return jsonResponse({ ok: false, error: 'Forbidden' }, 403)

    const payload = await req.json().catch(() => null)
    if (!payload) return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400)

    const parsed = ServicesSettingsSchema.safeParse(payload)
    if (!parsed.success) {
      return jsonResponse({ ok: false, error: 'Validation failed', issues: parsed.error.format() }, 400)
    }

    const toWrite = Object.assign({}, DEFAULTS, parsed.data)
    const ok = await writeSettingsFile(toWrite)
    if (!ok) return jsonResponse({ ok: false, error: 'Failed to persist settings' }, 500)

    return jsonResponse({ ok: true, data: toWrite })
  } catch (e: any) {
    return jsonResponse({ ok: false, error: String(e?.message || 'Unknown error') }, 500)
  }
}
