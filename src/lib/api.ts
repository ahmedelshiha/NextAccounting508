export async function apiFetch(path: RequestInfo | string, options?: RequestInit) {
  const defaultOpts: RequestInit = { credentials: 'same-origin', cache: 'no-store', keepalive: false, ...options }
  const debug = typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_DEBUG_FETCH === '1')

  const envTimeout = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FETCH_TIMEOUT) ? Number(process.env.NEXT_PUBLIC_FETCH_TIMEOUT) : undefined
  const defaultTimeout = typeof window === 'undefined' ? 0 : (Number.isFinite(envTimeout as number) && (envTimeout as number) > 0 ? (envTimeout as number) : 45000)
  const timeoutMs = (options && (options as any).timeout) || defaultTimeout

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
    if (timeoutMs && !(options && (options as any).signal)) {
      // Provide a reason when aborting so error messages include context (avoids "signal is aborted without reason").
      // Use DOMException where available so the abort reason has the 'AbortError' name and is compatible with fetch implementations.
      timeout = setTimeout(() => {
        // Abort the request on timeout. Provide a reason where supported to produce a better error message.
        try {
          const ReasonCtor = (typeof (globalThis as any).DOMException !== 'undefined') ? (globalThis as any).DOMException : undefined
          if (ReasonCtor) {
            try { controller.abort(new ReasonCtor('Request timed out', 'AbortError')) } catch { controller.abort() }
          } else {
            try { controller.abort() } catch {}
          }
        } catch {
          try { controller.abort() } catch {}
        }
      }, timeoutMs)
    }
    try {
      return await fetch(info as RequestInfo, { ...defaultOpts, signal })
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

        // Distinguish between external abort (caller-provided signal) and internal timeout abort.
        if (err instanceof DOMException && err.name === 'AbortError') {
          const optSignal = options && (options as any).signal
          if (optSignal && optSignal.aborted) {
            // External abort requested by caller — bubble up so caller can handle cancellation.
            throw err
          }
          // Otherwise it's an internal timeout-induced abort; treat as a network error and allow retries.
        }

        const isAbort = (err instanceof DOMException && err.name === 'AbortError')
        const network = isNetworkError(err) || isAbort
        if (debug) {
          try { console.warn('apiFetch attempt failed', { attempt, info, err }) } catch {}
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
      // Only use a public API base on the browser when it's same-origin to avoid CORS/CSP issues across deployments
      const baseOrigin = new URL(base, window.location.origin).origin
      if (baseOrigin === window.location.origin) {
        return withRetries(`${base}${path}`)
      }
      // Different origin — prefer same-origin relative fetch
      return withRetries(path)
    } catch (e) {
      // Fallback to default behavior
      return withRetries(path)
    }
  }

  // Default behavior: attempt as-is (relative path) — withRetries will try origin fallback if needed
  return withRetries(path)
}
