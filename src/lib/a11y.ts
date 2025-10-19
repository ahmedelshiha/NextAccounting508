export function announce(message: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  try {
    let el = document.getElementById('app-aria-live') as HTMLDivElement | null
    if (!el) {
      el = document.createElement('div')
      el.id = 'app-aria-live'
      el.setAttribute('role', 'status')
      el.setAttribute('aria-live', 'polite')
      el.setAttribute('aria-atomic', 'true')
      el.className = 'sr-only'
      document.body.appendChild(el)
    }
    el.textContent = message
    // Clear after a short delay to ensure subsequent identical messages are announced
    window.setTimeout(() => { if (el) el.textContent = '' }, 1000)
  } catch {}
}
