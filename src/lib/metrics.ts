import { logInfo } from '@/lib/log'

const g = globalThis as unknown as { __metrics?: Record<string, { count: number; totalMs: number }> }
if (!g.__metrics) g.__metrics = {}
const store = g.__metrics

export function recordMetric(name: string, ms: number) {
  const m = store[name] || { count: 0, totalMs: 0 }
  m.count += 1
  m.totalMs += ms
  store[name] = m
  if (process.env.NODE_ENV !== 'production') {
    logInfo('metric', { name, ms, count: m.count, avg: Math.round(m.totalMs / m.count) })
  }
}
