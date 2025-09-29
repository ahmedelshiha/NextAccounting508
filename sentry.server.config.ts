import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? (process.env.NODE_ENV === 'production' ? '0.1' : '0.2')),
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
  enabled: !!process.env.SENTRY_DSN,
})
