export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return
  try {
    const mod = '@sentry/nextjs'
    const Sentry: any = await import(mod)
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  } catch {
    // Silently ignore Sentry init errors in development
  }
}
