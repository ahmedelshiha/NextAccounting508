// src/lib/localStorage.ts
// Small wrapper for JSON-safe localStorage access with SSR-safety.

export function isBrowser() {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function getJSON<T = any>(key: string, fallback: T | null = null): T | null {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (e) {
    // If parsing fails, remove the corrupt entry and return fallback
    try { window.localStorage.removeItem(key) } catch {}
    return fallback
  }
}

export function setJSON<T = any>(key: string, value: T) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    // ignore quota exceeded or other errors
    console.warn('localStorage setJSON failed', e)
  }
}

export function remove(key: string) {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(key)
  } catch (e) {}
}
