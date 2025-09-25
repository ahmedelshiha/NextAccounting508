export async function register() {
  try {
    // Ensure Sentry is initialized in the proper runtime via side-effect imports
    // Next.js sets NEXT_RUNTIME to 'nodejs' for server and 'edge' for edge runtime
    const runtime = (process as any)?.env?.NEXT_RUNTIME
    if (runtime === 'edge') {
      await import('../sentry.edge.config')
    } else {
      await import('../sentry.server.config')
    }
  } catch (e) {
    // As a fallback, try client config import in case of mis-detection
    try { await import('../sentry.client.config') } catch {}
  }
}
