export async function apiFetch(path: string, options?: RequestInit) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = path.startsWith('http') ? path : `${origin}${path}`

  const opts: RequestInit = {
    credentials: 'include',
    ...options,
  }

  try {
    return await fetch(url, opts)
  } catch (err) {
    // Provide more context and attempt a relative-path fallback for environments
    // where origin-based fetch may fail (iframes, proxies, injected hosts)
    try {
      console.error('apiFetch failed for URL:', url, 'opts:', opts, 'error:', err)
    } catch (e) {
      console.error('apiFetch failed, and failed to log details', e)
    }

    // If url was absolute using origin, try the relative path as a fallback
    if (typeof window !== 'undefined' && url.startsWith(origin) && path.startsWith('/')) {
      try {
        return await fetch(path, opts)
      } catch (err2) {
        console.error('apiFetch relative fallback also failed for path:', path, 'error:', err2)
        throw err2
      }
    }

    throw err
  }
}
