export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  const enabled = process.env.NODE_ENV === 'production' && Boolean(dsn)
  if (!enabled) return

  const mod = '@sentry/nextjs'
  const { init } = await import(mod)
  init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: true,
    environment: process.env.NODE_ENV,
  })
}
