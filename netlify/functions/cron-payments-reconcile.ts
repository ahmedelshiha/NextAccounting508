import type { Handler } from '@netlify/functions'
import { reconcileStripePayments } from '@/lib/cron/payments'

export const handler: Handler = async () => {
  try {
    const result = await reconcileStripePayments()
    const statusCode = result.ok ? 200 : 200
    return { statusCode, body: JSON.stringify(result) }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(e?.message || 'error') }) }
  }
}
