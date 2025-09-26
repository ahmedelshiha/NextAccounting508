export async function register() {
  // In development, skip Sentry initialization to reduce startup overhead
  if (process.env.NODE_ENV !== 'production') return
  try {
    const runtime = (process as any)?.env?.NEXT_RUNTIME
    if (runtime === 'edge') {
      await import('../sentry.edge.config')
    } else {
      await import('../sentry.server.config')
    }
  } catch (e) {
    try { await import('../sentry.client.config') } catch {}
  }
}
