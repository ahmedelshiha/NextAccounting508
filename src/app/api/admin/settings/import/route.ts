import { NextResponse } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ImportSchema = z.object({ exportedAt: z.string().optional(), env: z.record(z.string(), z.any()).optional() })

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const parsed = ImportSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    // TODO: Persist settings to DB or configuration store. For now, just echo back.
    return NextResponse.json({ ok: true, importedAt: new Date().toISOString(), data: parsed.data })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }
}
