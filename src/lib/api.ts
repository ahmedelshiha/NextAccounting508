export async function apiFetch(path: RequestInfo | string, options?: RequestInit) {
  const opts: RequestInit = { credentials: 'include', cache: 'no-store', keepalive: false, ...options }
  const debug = typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_DEBUG_FETCH === '1')

  // attempt returns a Response object even on network failures to avoid unhandled rejections
  const attempt = async (info: RequestInfo | string) => {
    try {
      return await fetch(info as RequestInfo, opts)
    } catch (err) {
      if (debug) {
        try { console.warn('apiFetch network error (attempt):', { info, opts, err }) } catch {}
      }
      // Return a synthetic Response to let callers handle non-ok responses gracefully
      return new Response(null, { status: 0, statusText: String(err) })
    }
  }

  const withRetries = async (info: RequestInfo | string) => {
    const max = 2
    for (let i = 0; i <= max; i++) {
      const res = await attempt(info)
      // treat status 0 (our synthetic response) as a network error and retry when possible
      if (res instanceof Response && res.status === 0) {
        const isNetwork = true
        if (i < max && isNetwork) {
          await new Promise((r) => setTimeout(r, 150 * Math.pow(2, i)))
          continue
        }
        return res
      }
      return res
    }
    // fallback synthetic response
    return new Response(null, { status: 0, statusText: 'Network Error' })
  }

  if (typeof path !== 'string') {
    return withRetries(path)
  }

  if (typeof window !== 'undefined') {
    // Use relative paths directly to work with Builder/Preview proxy and avoid issues with window.location.origin in iframe
    const url = typeof path === 'string' && path.startsWith('/') ? path : (path as string)
    return withRetries(url as RequestInfo)
  }

  const url = path
  return withRetries(url as RequestInfo)
}
