if (process.env.NODE_ENV === 'production') {
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        enabled: true,
        environment: process.env.NODE_ENV,
      })
    })
    .catch(() => {})
}
