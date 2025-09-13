export async function register() {
  // Sentry instrumentation disabled by default to avoid optional dependency errors in dev.
  // Enable by setting NEXT_PUBLIC_ENABLE_SENTRY=1 and adding @sentry/nextjs.
  if (process.env.NEXT_PUBLIC_ENABLE_SENTRY !== '1') return
  try {
    const dynImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>
    const Sentry: any = await dynImport('@sentry/nextjs')
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (!dsn) return
    Sentry.init({ dsn, tracesSampleRate: 1.0 })
  } catch {}
}
