import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'admin-settings-services.json')
const base = 'https://t1.example.com'

beforeEach(() => {
  try { if (fs.existsSync(FILE)) fs.unlinkSync(FILE) } catch {}
})

describe('admin settings services API', () => {
  it('GET returns defaults when missing', async () => {
    const mod = await import('@/app/api/admin/settings/services/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/settings/services`))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
    expect(json.ok).toBe(true)
    expect(json.data).toBeDefined()
    expect(json.data.defaultCurrency).toBeDefined()
  })

  it('POST persists settings and GET reflects them', async () => {
    const mod = await import('@/app/api/admin/settings/services/route')
    const payload = {
      defaultCategory: 'Advisory',
      defaultCurrency: 'EUR',
      allowCloning: false,
      featuredToggleEnabled: false,
      priceRounding: 3,
      defaultRequestStatus: 'IN_REVIEW',
      autoAssign: false,
      autoAssignStrategy: 'load_based',
      allowConvertToBooking: false,
      defaultBookingType: 'CONSULTATION',
    }

    const postRes: any = await mod.POST(new Request(`${base}/api/admin/settings/services`, { method: 'POST', body: JSON.stringify(payload) }))
    expect(postRes.status).toBe(200)
    const out = await postRes.json()
    expect(out.ok).toBe(true)
    expect(out.data.defaultCurrency).toBe('EUR')

    // file persisted
    expect(fs.existsSync(FILE)).toBe(true)
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
    expect(raw.defaultCategory).toBe('Advisory')

    // GET reflects persisted
    const getRes: any = await mod.GET(new Request(`${base}/api/admin/settings/services`))
    expect(getRes.status).toBe(200)
    const getJson = await getRes.json()
    expect(getJson.ok).toBe(true)
    expect(getJson.data.defaultCurrency).toBe('EUR')
  })
})
