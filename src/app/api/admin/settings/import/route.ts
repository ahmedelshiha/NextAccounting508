import { NextResponse } from 'next/server'
import { z } from 'zod'

const ImportSchema = z.object({ exportedAt: z.string().optional(), env: z.record(z.string(), z.any()).optional() })

function jsonResponse(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const _api_POST = async (req: Request) => {
  try {
    const payload = await req.json()
    const parsed = ImportSchema.safeParse(payload)
    if (!parsed.success) {
      return jsonResponse({ ok: false, error: 'Invalid payload' }, 400)
    }

    // TODO: Persist settings to DB or configuration store. For now, just echo back.
    return jsonResponse({ ok: true, importedAt: new Date().toISOString(), data: parsed.data })
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400)
  }
}

import { withTenantContext } from '@/lib/api-wrapper'
export const POST = withTenantContext(_api_POST, { requireAuth: false })
