/**
 * Shared health check utilities used by API routes and functions.
 * Provides standardized collection of system health metrics.
 */

import { queryTenantRaw } from '@/lib/db-raw'

/** Summary of a subsystem check */
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unavailable'
  message?: string
}

/** System health rollup */
export interface SystemHealth {
  summary: { overall: 'operational' | 'degraded'; timestamp: string }
  db: HealthCheck
  email: HealthCheck
  auth: HealthCheck
  externalApis: { name: string; status: 'healthy' | 'degraded' | 'unavailable'; message?: string }[]
  realtime?: any
}

/** Check Postgres connectivity. Honors DATABASE_URL and NETLIFY_DATABASE_URL. */
export async function checkDatabase(): Promise<HealthCheck> {
  try {
    const dbUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL
    if (!dbUrl) return { status: 'degraded', message: 'Database URL not set' }
    await queryTenantRaw`SELECT 1`
    return { status: 'healthy' }
  } catch (e) {
    return { status: 'unavailable', message: 'DB query failed' }
  }
}

/** Check email provider configuration (SendGrid presence only). */
export function checkEmail(): HealthCheck {
  const configured = Boolean(process.env.SENDGRID_API_KEY)
  return { status: configured ? 'healthy' : 'degraded', message: configured ? undefined : 'SENDGRID_API_KEY not set' }
}

/** Check auth configuration (NextAuth env presence). */
export function checkAuth(): HealthCheck {
  const configured = Boolean(process.env.NEXTAUTH_URL) && Boolean(process.env.NEXTAUTH_SECRET)
  return { status: configured ? 'healthy' : 'degraded', message: configured ? undefined : 'NEXTAUTH envs missing' }
}

/** Collect system health with optional realtime metrics. */
export async function collectSystemHealth({ includeRealtime = false }: { includeRealtime?: boolean } = {}): Promise<SystemHealth> {
  const [db, email, auth] = await Promise.all([checkDatabase(), Promise.resolve(checkEmail()), Promise.resolve(checkAuth())])

  const externalApis = [
    { name: 'Neon', status: (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL) ? 'healthy' as const : 'degraded' as const, message: (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL) ? undefined : 'DB URL missing' },
  ]

  const overall: 'operational' | 'degraded' = db.status === 'healthy' && email.status === 'healthy' && auth.status === 'healthy' ? 'operational' : 'degraded'

  let realtime: any = undefined
  if (includeRealtime) {
    try {
      // Lazy import to avoid hard dependency in environments without realtime
      const mod = await import('@/lib/realtime-enhanced')
      if (mod && typeof mod.getRealtimeMetrics === 'function') {
        realtime = mod.getRealtimeMetrics()
      }
    } catch {
      realtime = undefined
    }
  }

  return {
    summary: { overall, timestamp: new Date().toISOString() },
    db,
    email,
    auth,
    externalApis,
    ...(includeRealtime && realtime ? { realtime } : {}),
  }
}

/** Map system health to a compact security health payload. */
export function toSecurityHealthPayload(h: SystemHealth) {
  const status = h.summary.overall === 'operational' ? 'ok' : 'degraded'
  const checks = [
    { name: 'Database', status: h.db.status },
    { name: 'Email', status: h.email.status },
    { name: 'Auth', status: h.auth.status },
  ]
  return { success: true, data: { status, checks } }
}
