import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined,
  tracesSampleRate: 0.05,
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
})
