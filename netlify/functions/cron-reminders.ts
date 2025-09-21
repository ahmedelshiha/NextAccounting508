export const config = { schedule: '*/15 * * * *' }

// Scheduled function: triggers the internal reminders cron endpoint
// Runs every 15 minutes to align with reminder windows (e.g., 24h and 2h before)
// Uses x-cron-secret header if configured to protect the internal route
async function handler() {
  const origin = process.env.URL || process.env.SITE_URL
  if (!origin) {
    console.warn('cron-reminders: No site URL available')
    return
  }

  const secret = process.env.CRON_SECRET || process.env.NEXT_CRON_SECRET

  try {
    const res = await fetch(`${origin}/api/cron/reminders`, {
      method: 'POST',
      headers: {
        ...(secret ? { 'x-cron-secret': secret } : {}),
      },
    })

    const json = await res.json().catch(() => null)

    // Best-effort telemetry to health logs
    try {
      await fetch(`${origin}/api/health/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'CRON',
          status: res.ok ? 'ok' : 'error',
          message: res.ok ? 'cron-reminders ok' : JSON.stringify(json || {}),
        }),
      })
    } catch {}
  } catch (err) {
    console.error('cron-reminders run failed:', err)
    try {
      await fetch(`${origin}/api/health/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'CRON', status: 'error', message: 'cron-reminders failed' }),
      })
    } catch {}
  }
}

export default handler
