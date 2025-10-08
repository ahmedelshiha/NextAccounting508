export const config = { schedule: '*/5 * * * *' }

async function notify(message: string) {
  try {
    const webhook = process.env.SLACK_WEBHOOK_URL
    if (webhook) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      })
      return
    }
    const to = process.env.ALERT_EMAIL
    const origin = process.env.URL || process.env.SITE_URL || ''
    if (to) {
      await fetch(`${origin}/api/email-check`, { method: 'GET', cache: 'no-store' })
    }
  } catch (err) {
    console.error('Health monitor notify failed:', err)
  }
}

const handler = async () => {
  const origin = process.env.URL || process.env.SITE_URL
  if (!origin) {
    console.warn('No site URL available for health checks')
    return
  }
  try {
    const { collectSystemHealth } = await import('@/lib/health')
    const health = await collectSystemHealth({ includeRealtime: false })

    const dbOk = health.db.status === 'healthy'
    const emailOk = health.email.status === 'healthy'
    const dbMsg = health.db.message || null
    const emailMsg = health.email.message || null

    // Log results to HealthLog via API (two entries to preserve existing consumers)
    await Promise.all([
      fetch(`${origin}/api/health/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'db', status: dbOk ? 'ok' : 'error', message: dbMsg }),
      }),
      fetch(`${origin}/api/health/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'email', status: emailOk ? 'ok' : 'error', message: emailMsg }),
      }),
    ])

    if (!dbOk || !emailOk) {
      await notify(`Health check failed: DB=${dbOk}, EMAIL=${emailOk}`)
    }
  } catch (error) {
    console.error('Health monitor run failed:', error)
    await notify('Health monitor could not complete checks')
  }
}

export default handler
