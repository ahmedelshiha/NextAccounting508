import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as svc from '@/services/settings.service'

describe('settings.service client helpers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('runDiagnostics calls POST and returns JSON', async () => {
    const mockRes = { ok: true, json: vi.fn().mockResolvedValue({ results: { database: true } }) }
    globalThis.fetch = vi.fn().mockResolvedValue(mockRes) as any

    const res = await svc.runDiagnostics()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/admin/settings/diagnostics', { method: 'POST' })
    expect(res).toEqual({ results: { database: true } })
  })

  it('exportSettings fetches blob', async () => {
    const blob = new Blob([JSON.stringify({})], { type: 'application/json' })
    const mockRes = { ok: true, blob: vi.fn().mockResolvedValue(blob) }
    globalThis.fetch = vi.fn().mockResolvedValue(mockRes) as any

    const res = await svc.exportSettings()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/admin/settings/export')
    expect(res).toBeInstanceOf(Blob)
  })

  it('importSettings posts JSON and returns JSON on success', async () => {
    const payload = { foo: 'bar' }
    const mockRes = { ok: true, json: vi.fn().mockResolvedValue({ ok: true }) }
    globalThis.fetch = vi.fn().mockResolvedValue(mockRes) as any

    const res = await svc.importSettings(payload)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/admin/settings/import', expect.objectContaining({ method: 'POST' }))
    expect(res).toEqual({ ok: true })
  })
})
