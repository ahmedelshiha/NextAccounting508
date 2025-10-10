export async function captureErrorIfAvailable(err: unknown, meta?: Record<string, unknown>) {
  try {
    const mod = await import('@/lib/observability').catch(() => null as any)
    if (mod && typeof mod.captureError === 'function') {
      // Normalize meta to observability.captureError context shape: { tags?: Record<string,string>, extra?: Record<string, any> }
      const ctx: any = {}
      if (meta && typeof meta === 'object') {
        const copy: Record<string, unknown> = { ...(meta as Record<string, unknown>) }
        // Promote top-level 'route' into tags.route
        if (typeof copy['route'] === 'string' || typeof copy['route'] === 'number') {
          ctx.tags = { ...(ctx.tags || {}), route: String(copy['route']) }
          delete copy['route']
        }
        // If any remaining keys, put them under extra
        if (Object.keys(copy).length > 0) ctx.extra = copy
      }
      await mod.captureError(err, ctx)
    }
  } catch {}
}

export async function logAuditSafe(payload: any) {
  try {
    const mod = await import('@/lib/audit').catch(() => null as any)
    if (mod && typeof mod.logAudit === 'function') {
      await mod.logAudit(payload)
    }
  } catch {}
}

// Lightweight in-memory metrics counters for runtime and test assertions
const __metricsCounters: Record<string, number> = Object.create(null)

/** Increment a named metric counter (lightweight, in-memory). */
export function incrementMetric(name: string, tags?: Record<string, string>): void {
  try {
    const key = typeof tags === 'object' && tags
      ? `${name}|${Object.keys(tags).sort().map(k => `${k}=${String(tags[k])}`).join(',')}`
      : name
    __metricsCounters[key] = (__metricsCounters[key] ?? 0) + 1
  } catch {
    // no-op
  }
}

/** Snapshot current counters (immutable copy). Useful for tests/diagnostics. */
export function getMetricsSnapshot(): Readonly<Record<string, number>> {
  return Object.freeze({ ...__metricsCounters })
}
