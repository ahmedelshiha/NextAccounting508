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
    console.error('apiFetch failed:', err)
    throw err
  }
}
