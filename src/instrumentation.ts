export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return
  try {
    if (process.env.NODE_ENV !== 'production') return
    const dynImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>
    const Sentry: any = await dynImport('@sentry/nextjs')
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  } catch {
    // Silently ignore Sentry init errors in development or when dependency is missing
  }
}
