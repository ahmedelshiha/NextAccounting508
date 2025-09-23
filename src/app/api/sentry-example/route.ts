import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    throw new Error('Sentry Server Test Error')
  } catch (e) {
    Sentry.captureException(e)
    throw e
  }
}
