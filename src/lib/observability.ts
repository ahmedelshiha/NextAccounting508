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
      if (context && typeof mod.setContext === 'function') {
        try { mod.setContext('ctx', context) } catch {}
      }
      mod.captureException(err)
    }
  } catch {
    // ignore
  }
}
