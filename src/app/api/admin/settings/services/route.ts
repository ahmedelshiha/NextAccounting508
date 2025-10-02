import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import servicesSettingsService, { flattenSettings } from '@/services/services-settings.service'
import { ZodError } from 'zod'

function jsonResponse(payload: any, status = 200) {
  return NextResponse.json(payload, { status })
}

export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401)
    }

    const role = (session.user as any)?.role as string | undefined
    if (!hasPermission(role, PERMISSIONS.SERVICES_VIEW)) {
      return jsonResponse({ ok: false, error: 'Forbidden' }, 403)
    }

    const data = await servicesSettingsService.getFlat(null)
    return jsonResponse({ ok: true, data })
  } catch (error: any) {
    return jsonResponse({ ok: false, error: String(error?.message ?? 'Unknown error') }, 500)
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401)
    }

    const role = (session.user as any)?.role as string | undefined
    if (!hasPermission(role, PERMISSIONS.SERVICES_EDIT)) {
      return jsonResponse({ ok: false, error: 'Forbidden' }, 403)
    }

    const payload = await req.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400)
    }

    const saved = await servicesSettingsService.save(payload)
    return jsonResponse({ ok: true, data: flattenSettings(saved) })
  } catch (error: any) {
    if (error instanceof ZodError) {
      return jsonResponse({ ok: false, error: 'Validation failed', issues: error.format() }, 400)
    }

    return jsonResponse({ ok: false, error: String(error?.message ?? 'Unknown error') }, 500)
  }
}
