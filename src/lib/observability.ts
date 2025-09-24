import * as Sentry from '@sentry/nextjs'

export async function withSpan<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  // If Sentry SDK is unavailable, just run the function
  const hub = (Sentry as any)?.getCurrentHub?.()
  if (!hub) return await Promise.resolve(fn())

  return await Sentry.startSpan({ name }, async () => {
    try {
      return await fn()
    } catch (err) {
      Sentry.captureException(err, { tags: { span: name } })
      throw err
    }
  })
}

export function captureError(err: unknown, context?: { tags?: Record<string, string>; extra?: Record<string, any> }) {
  try {
    Sentry.captureException(err, context)
  } catch {
    // no-op
  }
}
