export const reportWebVitals = (metric: any) => {
  try {
    if (typeof (globalThis as any).gtag !== 'undefined') {
      (globalThis as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true
      })
    }
  } catch (e) {
    // ignore errors in telemetry
    // console.warn('reportWebVitals error', e)
  }
}

export default reportWebVitals
