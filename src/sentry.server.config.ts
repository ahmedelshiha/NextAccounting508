import * as Sentry from '@sentry/nextjs'
import { tenantContext } from '@/lib/tenant-context'

// Minimal Sentry server config used by tests — register an event processor that enriches events
// with tenant context when available. Keep initialization minimal to avoid side-effects in tests.
Sentry.init({
  // intentionally empty - tests mock Sentry APIs
})

Sentry.addEventProcessor((event: any) => {
  try {
    const ctx = tenantContext.getContextOrNull()
    if (!ctx) return event

    event.tags = { ...(event.tags || {}), tenantId: ctx.tenantId, tenantSlug: ctx.tenantSlug, requestId: ctx.requestId, role: ctx.role, tenantRole: ctx.tenantRole }
    event.user = { ...(event.user || {}), id: ctx.userId ?? undefined, email: ctx.userEmail ?? undefined, username: ctx.userName ?? undefined }
    return event
  } catch (err) {
    // Defensive: if tenantContext APIs throw, do not break Sentry processing
    return event
  }
})
