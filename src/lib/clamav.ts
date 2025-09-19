import { captureErrorIfAvailable } from '@/lib/observability-helpers'

export interface ClamAVScanOptions {
  timeoutMs?: number
  retries?: number
}

export interface ClamAVScanResult {
  clean: boolean
  details: any
}

/**
 * Scan a file buffer against the configured antivirus endpoint.
 * Uses process.env.UPLOADS_AV_SCAN_URL. Optional API key headers supported via UPLOADS_AV_API_KEY or CLAMAV_API_KEY.
 * Retries with exponential backoff on transient errors. Times out per attempt.
 */
export async function scanBuffer(buf: Buffer | Uint8Array, options: ClamAVScanOptions = {}): Promise<ClamAVScanResult> {
  const url = process.env.UPLOADS_AV_SCAN_URL
  if (!url) throw new Error('UPLOADS_AV_SCAN_URL not configured')

  const timeoutMs = options.timeoutMs ?? 10_000
  const retries = Math.max(0, options.retries ?? 2)

  const headers: Record<string, string> = { 'content-type': 'application/octet-stream' }
  const apiKey = process.env.UPLOADS_AV_API_KEY || process.env.CLAMAV_API_KEY
  if (apiKey) headers['X-API-KEY'] = apiKey

  let lastErr: any
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ac = new AbortController()
      const t = setTimeout(() => ac.abort(), timeoutMs)
      const res = await fetch(url, { method: 'POST', headers, body: buf as unknown as BodyInit, signal: ac.signal })
      clearTimeout(t)

      // Parse JSON best-effort
      const json: any = await res.json().catch(() => ({}))

      // Normalize result across possible schemas
      // Preferred: { status: 'clean' | 'infected' | 'error' }
      // Fallback: { clean: boolean }
      const status: string | undefined = typeof json?.status === 'string' ? json.status.toLowerCase() : undefined
      const hasCleanBool = typeof json?.clean === 'boolean'
      const clean = status ? (status === 'clean') : (hasCleanBool ? json.clean === true : res.ok)

      // Treat non-2xx + no explicit clean=true as failure
      if (!res.ok && clean !== true) {
        throw new Error(`AV scan HTTP ${res.status}`)
      }

      return { clean, details: json }
    } catch (e: any) {
      lastErr = e
      // Backoff before next attempt
      if (attempt < retries) {
        const wait = Math.pow(2, attempt) * 250
        await new Promise(r => setTimeout(r, wait))
        continue
      }
      try { await captureErrorIfAvailable(e, { lib: 'clamav', action: 'scanBuffer', attempt }) } catch {}
    }
  }

  throw lastErr || new Error('AV scan failed')
}
