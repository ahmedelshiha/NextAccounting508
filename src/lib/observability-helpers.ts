export async function captureErrorIfAvailable(err: unknown, meta?: Record<string, unknown>) {
  try {
    const mod = await import('@/lib/observability').catch(() => null as any)
    if (mod && typeof mod.captureError === 'function') {
      await mod.captureError(err, meta)
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
