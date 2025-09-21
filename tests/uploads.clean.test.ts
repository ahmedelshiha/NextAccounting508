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
  }
}
vi.mock('@/lib/prisma', () => ({ default: prismaMock }))


describe('uploads API — clean file', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...OLD_ENV, UPLOADS_PROVIDER: 'netlify', NETLIFY_BLOBS_TOKEN: 't', UPLOADS_AV_SCAN_URL: 'https://av/scan', UPLOADS_AV_POLICY: 'lenient' }
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'clean', clean: true }) })
    prismaMock.attachment.create.mockClear()
  })
  afterEach(() => { process.env = OLD_ENV })

  it('stores file and persists avStatus clean', async () => {
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
    expect(prismaMock.attachment.create).toHaveBeenCalled()
    const call = prismaMock.attachment.create.mock.calls[0][0]
    expect(call.data.avStatus).toBe('clean')
  })
})
