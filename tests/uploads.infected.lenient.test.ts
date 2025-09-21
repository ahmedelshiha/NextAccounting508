vi.mock('@netlify/blobs', () => ({
  Blobs: class {
    token: string
    constructor({ token }: any) { this.token = token }
    async set(key: string, buf: any) { return true }
    getPublicUrl(key: string) { return `https://blobs.example/${key}` }
  }
}))

const prismaMock: any = {
  attachment: {
    create: vi.fn(async ({ data }: any) => ({ id: 'att1', ...data })),
    findUnique: vi.fn(async () => ({ id: 'att1', key: 'uploads/x.bin' })),
    update: vi.fn(async ({ data }: any) => ({ id: 'att1', ...data })),
  },
  $queryRaw: vi.fn(async () => ([])),
}
vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

// Mock uploads-provider helpers for av-callback quarantine move
const providerHelpers = {
  moveToQuarantine: vi.fn(async (key: string) => ({ ok: true, key: `quarantine/${key}` }))
}
vi.mock('@/lib/uploads-provider', () => providerHelpers)


describe('uploads API — infected (lenient) and AV callback quarantine', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...OLD_ENV, UPLOADS_PROVIDER: 'netlify', NETLIFY_BLOBS_TOKEN: 't', UPLOADS_AV_SCAN_URL: 'https://av/scan', UPLOADS_AV_POLICY: 'lenient' }
    // AV scan returns infected
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'infected', clean: false, threat_name: 'EICAR' }) })
    prismaMock.attachment.create.mockClear()
    prismaMock.attachment.update.mockClear()
    providerHelpers.moveToQuarantine.mockClear()
  })
  afterEach(() => { process.env = OLD_ENV })

  it('stores file and persists avStatus infected under lenient policy', async () => {
    const { POST }: any = await import('@/app/api/uploads/route')
    const form = new FormData()
    const file = new File([new Uint8Array([1,2,3])], 'doc.pdf', { type: 'application/pdf' })
    form.set('file', file)
    form.set('folder', 'uploads')
    const req = new Request('https://x/api/uploads', { method: 'POST', body: form })

    const res: any = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    const call = prismaMock.attachment.create.mock.calls[0][0]
    expect(call.data.avStatus).toBe('infected')
    expect(call.data.avThreatName).toBe('EICAR')
  })

  it('av-callback moves object to quarantine and updates records', async () => {
    const { POST }: any = await import('@/app/api/uploads/av-callback/route')
    const payload = { key: 'uploads/x.bin', result: { clean: false, threat_name: 'EICAR' } }
    const req = new Request('https://x/api/uploads/av-callback', { method: 'POST', body: JSON.stringify(payload) })
    const res: any = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.quarantined).toBe(true)
    expect(providerHelpers.moveToQuarantine).toHaveBeenCalledWith('uploads/x.bin')
    expect(prismaMock.attachment.update).toHaveBeenCalled()
  })
})
