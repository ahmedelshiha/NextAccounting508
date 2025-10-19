// Minimal Sentry server config placeholder for tests
const sentryServerConfig = {
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 0,
  enabled: false,
}

export default sentryServerConfig
