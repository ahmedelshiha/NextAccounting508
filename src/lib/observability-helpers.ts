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
