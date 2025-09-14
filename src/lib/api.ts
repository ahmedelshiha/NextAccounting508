export async function apiFetch(path: RequestInfo | string, options?: RequestInit) {
  const defaultOpts: RequestInit = { credentials: 'same-origin', cache: 'no-store', keepalive: false, ...options }
  const debug = typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_DEBUG_FETCH === '1')

  const timeoutMs = (options && (options as any).timeout) || 8000

  const isNetworkError = (err: unknown) => {
    try {
      const s = String(err || '').toLowerCase()
      return s.includes('failed to fetch') || s.includes('networkerror') || s.includes('network request failed')
    } catch {
      return false
    }
  }

  const doFetch = async (info: RequestInfo | string) : Promise<Response> => {
    const controller = new AbortController()
    const signal = options && (options as any).signal ? (options as any).signal : controller.signal
    let timeout: ReturnType<typeof setTimeout> | null = null
    let timedOut = false
    if (timeoutMs && !(options && (options as any).signal)) {
      timeout = setTimeout(() => {
        timedOut = true
        try { controller.abort() } catch {}
      }, timeoutMs)
    }

    try {
      return await fetch(info as RequestInfo, { ...defaultOpts, signal })
    } catch (err) {
      // If our controller triggered the abort due to timeout, wrap error with a flag so callers can distinguish
      if (timedOut) {
        const e: any = new Error('Request timed out')
        e.isTimeout = true
        throw e
      }
      throw err
    } finally {
      if (timeout) clearTimeout(timeout)
    }
  }

  const withRetries = async (info: RequestInfo | string) : Promise<Response> => {
    const maxRetries = 2
    let lastErr: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await doFetch(info)
        return res
      } catch (err) {
        lastErr = err
        // If this is an external abort (signal passed in by caller), rethrow so caller can handle
        if (err instanceof DOMException && err.name === 'AbortError') throw err

        // Treat our timeout errors as retriable network failures
        const isTimeoutErr = (err as any)?.isTimeout === true || String((err as any)?.message || '').toLowerCase().includes('timed out')
        let network = isNetworkError(err)
        if (isTimeoutErr) network = true

        if (debug) {
          try { console.warn('apiFetch attempt failed', { attempt, info, err, isTimeoutErr }) } catch {}
        }

        // retry only for network-type failures
        if (attempt < maxRetries && network) {
          await new Promise(r => setTimeout(r, 150 * Math.pow(2, attempt)))
          // try origin-prefixed fallback on second attempt in browser
          if (attempt === 0 && typeof window !== 'undefined' && typeof info === 'string' && info.startsWith('/')) {
            try {
              const originUrl = `${window.location.origin}${info}`
              const res = await doFetch(originUrl)
              return res
            } catch (e) {
              lastErr = e
            }
          }
          continue
        }

        // Non-retriable or exhausted retries — break loop
        break
      }
    }

    // If we exhausted retries or encountered non-network error, return a safe Response instead of throwing
    if (debug) {
      try { console.error('apiFetch final error, returning 503 response', lastErr) } catch {}
    }

    try {
      const body = typeof lastErr === 'string' ? lastErr : JSON.stringify({ error: 'Network error', detail: String(lastErr) })
      return new Response(body, { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } })
    } catch (e) {
      // Fallback: rethrow if Response construction fails
      throw lastErr
    }
  }

  // If a non-string RequestInfo was passed (Request), use it directly
  if (typeof path !== 'string') return withRetries(path)

  // Browser vs server: if an explicit public API base is provided, prefer it for relative paths
  if (typeof window !== 'undefined' && typeof path === 'string' && path.startsWith('/') && typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_BASE) {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE!.replace(/\/$/, '')
      return withRetries(`${base}${path}`)
    } catch (e) {
      // fallback to default behavior
      return withRetries(path)
    }
  }

  // Default behavior: attempt as-is (relative path) — withRetries will try origin fallback if needed
  return withRetries(path)
}
