import * as Sentry from '@sentry/nextjs'
import { tenantContext } from '@/lib/tenant-context'

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? (process.env.NODE_ENV === 'production' ? '0.1' : '0.2')),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
  enabled: !!process.env.SENTRY_DSN,
})

// Best-effort tagging for Edge (AsyncLocalStorage may be polyfilled)
Sentry.addEventProcessor((event) => {
  try {
    const ctx = tenantContext.getContextOrNull?.()
    if (ctx) {
      event.tags = {
        ...event.tags,
        tenantId: ctx.tenantId,
        tenantSlug: ctx.tenantSlug ?? undefined,
        requestId: ctx.requestId ?? undefined,
        role: ctx.role ?? undefined,
        tenantRole: ctx.tenantRole ?? undefined,
      }
      event.user = {
        ...(event.user || {}),
        id: ctx.userId || undefined,
        email: ctx.userEmail || undefined,
        username: ctx.userName || undefined,
      }
    }
  } catch {}
  return event
})
