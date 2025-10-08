import { NextRequest, NextResponse } from 'next/server'

/**
 * Validate cron secret from headers. Supports CRON_SECRET or NEXT_CRON_SECRET.
 * Returns null if authorized, or a NextResponse with 401 if unauthorized.
 */
export function authorizeCron(req: NextRequest): NextResponse | null {
  const headerAuth = req.headers.get('authorization') || ''
  const headerSecret = req.headers.get('x-cron-secret') || ''
  const envSecret = process.env.CRON_SECRET || process.env.NEXT_CRON_SECRET || ''
  if (!envSecret) return null // no secret configured => allow
  if (headerAuth === `Bearer ${envSecret}`) return null
  if (headerSecret === envSecret) return null
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * Helper to run a named cron task and return JSON with timing and result.
 */
export async function runCronTask<T>(name: string, fn: () => Promise<T>) {
  const started = Date.now()
  try {
    const data = await fn()
    return { success: true, task: name, durationMs: Date.now() - started, data }
  } catch (error: any) {
    return { success: false, task: name, durationMs: Date.now() - started, error: String(error?.message || error) }
  }
}
