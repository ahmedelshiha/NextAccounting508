export async function apiFetch(path: RequestInfo | string, options?: RequestInit) {
  const opts: RequestInit = { credentials: 'include', cache: 'no-store', keepalive: false, ...options }
  const debug = typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_DEBUG_FETCH === '1')

  const attempt = async (info: RequestInfo | string) => {
    return await fetch(info as RequestInfo, opts)
  }

  const withRetries = async (info: RequestInfo | string) => {
    const max = 2
    let lastErr: unknown
    for (let i = 0; i <= max; i++) {
      try {
        return await attempt(info)
      } catch (err) {
        lastErr = err
        const isAbort = err instanceof DOMException && err.name === 'AbortError'
        const isNetwork = typeof err === 'object' && err !== null && String(err).toLowerCase().includes('failed to fetch')
        if (isAbort) throw err
        if (i < max && isNetwork) {
          await new Promise((r) => setTimeout(r, 150 * Math.pow(2, i)))
          continue
        }
        if (debug) {
          try {
            console.warn('apiFetch failed:', { info, opts, err })
          } catch {}
        }
        throw err
      }
    }
    // Should not reach here
    throw lastErr
  }

  if (typeof path !== 'string') {
    return withRetries(path)
  }

  if (typeof window !== 'undefined') {
    const url = typeof path === 'string' && path.startsWith('/')
      ? new URL(path, window.location.origin).toString()
      : (path as string)
    return withRetries(url as RequestInfo)
  }

  const url = path
  return withRetries(url as RequestInfo)
}
