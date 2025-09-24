let inited = false
let lastDsn = ''

export async function initObservability() {
  try {
    const dsn = (typeof process !== 'undefined' && process.env && (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) ? (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)! : ''
    if (!dsn) return
    if (inited && dsn === lastDsn) return
    lastDsn = dsn

    const isServer = typeof window === 'undefined'
    if (isServer) {
      // Try nextjs/node SDK dynamically; avoid build-time hard dep
      const mod = (await (Function('m','return import(m)'))('@sentry/nextjs').catch(() => null))
        || (await (Function('m','return import(m)'))('@sentry/node').catch(() => null))
      if (mod && typeof mod.init === 'function') {
        mod.init({ dsn, tracesSampleRate: 0.1, environment: process.env.NODE_ENV || 'development' })
        inited = true
      }
    } else {
      const mod = await (Function('m','return import(m)'))('@sentry/nextjs').catch(async () => (await (Function('m','return import(m)'))('@sentry/browser').catch(() => null)))
      if (mod && typeof mod.init === 'function') {
        mod.init({ dsn, tracesSampleRate: 0.1, environment: (window as any).NODE_ENV || 'development' })
        inited = true
      }
    }
  } catch {
    // ignore
  }
}

export async function captureError(err: unknown, context?: Record<string, unknown>) {
  try {
    await initObservability()
    const isServer = typeof window === 'undefined'
    const mod: any = isServer
      ? (await (Function('m','return import(m)'))('@sentry/nextjs').catch(async () => (await (Function('m','return import(m)'))('@sentry/node').catch(() => null))))
      : (await (Function('m','return import(m)'))('@sentry/nextjs').catch(async () => (await (Function('m','return import(m)'))('@sentry/browser').catch(() => null))))
    if (mod && typeof mod.captureException === 'function') {
      try {
        if (context) {
          if (typeof mod.setContext === 'function') {
            try { mod.setContext('ctx', context) } catch {}
          }
          // Attach useful tags when available for better filtering in Sentry
          try {
            const maybeSetTag: any = (mod as any).setTag
            if (typeof maybeSetTag === 'function') {
              if ((context as any).route) maybeSetTag('route', String((context as any).route))
              if ((context as any).feature) maybeSetTag('feature', String((context as any).feature))
              if ((context as any).channel) maybeSetTag('channel', String((context as any).channel))
              if ((context as any).tenantId) maybeSetTag('tenantId', String((context as any).tenantId))
              if ((context as any).userId) maybeSetTag('userId', String((context as any).userId))
            } else if (typeof (mod as any).configureScope === 'function') {
              ;(mod as any).configureScope((scope: any) => {
                if ((context as any).route) scope.setTag('route', String((context as any).route))
                if ((context as any).feature) scope.setTag('feature', String((context as any).feature))
                if ((context as any).channel) scope.setTag('channel', String((context as any).channel))
                if ((context as any).tenantId) scope.setTag('tenantId', String((context as any).tenantId))
                if ((context as any).userId) scope.setTag('userId', String((context as any).userId))
              })
            }
          } catch {}
        }
      } catch {}
      mod.captureException(err)
    }
  } catch {
    // ignore
  }
}
