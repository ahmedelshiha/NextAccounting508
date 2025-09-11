export async function apiFetch(path: RequestInfo | string, options?: RequestInit) {
  const opts: RequestInit = { credentials: 'include', ...options }

  // Delegate non-string requests directly
  if (typeof path !== 'string') {
    try { return await fetch(path, opts) } catch (err) {
      try { console.error('apiFetch failed for RequestInfo:', path, 'opts:', opts, 'error:', err) } catch (e) { console.error(e) }
      throw err
    }
  }

  // In the browser, always use relative paths when given (better for proxies/iframes)
  if (typeof window !== 'undefined' && path.startsWith('/')) {
    try {
      return await fetch(path, opts)
    } catch (err) {
      console.error('apiFetch failed for relative path:', path, 'opts:', opts, 'error:', err)
      throw err
    }
  }

  // Absolute URLs or server-side fall back to provided value (or construct from origin if available)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = path.startsWith('http') ? path : `${origin}${path}`
  try {
    return await fetch(url, opts)
  } catch (err) {
    try { console.error('apiFetch failed for URL:', url, 'opts:', opts, 'error:', err) } catch (e) { console.error(e) }
    throw err
  }
}
