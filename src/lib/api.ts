export async function apiFetch(path: RequestInfo | string, options?: RequestInit) {
  const opts: RequestInit = { credentials: 'include', ...options }

  // Delegate non-string requests directly
  if (typeof path !== 'string') {
    try { return await fetch(path, opts) } catch (err) {
      try { console.error('apiFetch failed for RequestInfo:', path, 'opts:', opts, 'error:', err) } catch (e) { console.error(e) }
      throw err
    }
  }

  // Resolve to absolute URL in the browser to play nicely with preview/iframe proxies
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    const url = typeof path === 'string'
      ? (path.startsWith('http') ? path : new URL(path, origin).toString())
      : path
    try {
      return await fetch(url as RequestInfo, opts)
    } catch (err) {
      try {
        const u = typeof url === 'string' ? url : (url as Request).url
        console.error('apiFetch failed for URL:', u, 'opts:', opts, 'error:', err)
      } catch (e) { console.error(e) }
      throw err
    }
  }

  // Server-side: allow absolute or return as-is
  const url = typeof path === 'string' ? path : (path as Request).url
  try {
    return await fetch(url as RequestInfo, opts)
  } catch (err) {
    try { console.error('apiFetch failed server-side for URL:', url, 'opts:', opts, 'error:', err) } catch (e) { console.error(e) }
    throw err
  }
}
