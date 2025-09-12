export async function initSentry() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) {
    console.debug('Sentry DSN not configured')
    return
  }
  try {
    if (process.env.NODE_ENV !== 'production') return
    const mod = '@sentry/nextjs'
    const Sentry = await import(mod)
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
    })
    console.debug('Sentry initialized')
  } catch (e) {
    console.warn('Failed to initialize Sentry. Did you install @sentry/nextjs?', e)
  }
}
