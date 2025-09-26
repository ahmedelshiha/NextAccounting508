export const trackConversion = (eventName: string, data?: Record<string, any>) => {
  // Google Analytics 4
  if (typeof (globalThis as any).gtag !== 'undefined') {
    ;(globalThis as any).gtag('event', eventName, {
      event_category: 'conversion',
      event_label: data?.service || 'general',
      value: data?.value || 0,
      ...data
    })
  }

  // Facebook Pixel
  if (typeof (globalThis as any).fbq !== 'undefined') {
    ;(globalThis as any).fbq('track', eventName, data)
  }
}

export function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  if (typeof window !== 'undefined') {
    try {
      ;(window as any).gtag?.('event', eventName, properties)
      ;(window as any).fbq?.('track', eventName, properties)
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ event: eventName, properties, timestamp: Date.now() }),
      }).catch(() => {})
    } catch {}
  }
}

export default trackConversion
