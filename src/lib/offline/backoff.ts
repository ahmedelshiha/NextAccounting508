export type BackoffOptions = {
  baseMs?: number
  factor?: number
  maxMs?: number
  jitterRatio?: number // 0..1, applied as +/- jitter on computed delay
}

export function computeBackoffMs(retries: number, opts: BackoffOptions = {}): number {
  const base = Math.max(1, opts.baseMs ?? 5000)
  const factor = Math.max(1, opts.factor ?? 2)
  const max = Math.max(base, opts.maxMs ?? 5 * 60 * 1000)
  const jitterRatio = Math.min(1, Math.max(0, opts.jitterRatio ?? 0.2))
  const exp = Math.pow(factor, Math.max(0, retries))
  const raw = Math.min(max, Math.floor(base * exp))
  if (jitterRatio <= 0) return raw
  const jitter = Math.floor(raw * jitterRatio)
  const sign = Math.random() < 0.5 ? -1 : 1
  return Math.max(0, raw + sign * Math.floor(Math.random() * (jitter + 1)))
}

export function isRetriableStatus(status: number): boolean {
  if (!status || status === 0) return true // network error treated as retriable
  if (status === 408 || status === 425 || status === 429) return true
  if (status >= 500 && status <= 599) return true
  return false
}
