import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined,
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? (process.env.NODE_ENV === 'production' ? '0.1' : '0.2')),
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,
  tunnel: "/monitoring",
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
})
