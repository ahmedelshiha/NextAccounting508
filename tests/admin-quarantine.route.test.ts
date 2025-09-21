vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const prismaMock: any = {
  attachment: {
    count: vi.fn(async () => 2),
    findMany: vi.fn(async () => ([
      { id: 'a1', key: 'uploads/a.pdf', name: 'a.pdf', avStatus: 'infected', uploadedAt: new Date().toISOString(), size: 1234 },
      { id: 'a2', key: 'uploads/b.pdf', name: 'b.pdf', avStatus: 'error', uploadedAt: new Date().toISOString(), size: 2345 },
    ])),
  },
}
vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

const providerHelpers = {
  listQuarantine: vi.fn(async () => ([
    { key: 'quarantine/uploads/a.pdf', size: 1234, createdAt: new Date().toISOString() },
    { key: 'quarantine/uploads/c.pdf', size: 4567, createdAt: new Date().toISOString() },
  ])),
  removeObject: vi.fn(async () => true),
  releaseFromQuarantine: vi.fn(async (k: string) => ({ ok: true, key: k.replace(/^quarantine\//, 'uploads/') })),
}
vi.mock('@/lib/uploads-provider', () => providerHelpers)


describe('admin uploads quarantine API', () => {
  it('GET returns db and provider items with meta', async () => {
    process.env.UPLOADS_PROVIDER = 'netlify'
    const { GET }: any = await import('@/app/api/admin/uploads/quarantine/route')
    const res: any = await GET(new Request('https://x/api/admin/uploads/quarantine'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.db)).toBe(true)
    expect(Array.isArray(json.data.provider)).toBe(true)
    expect(json.meta.db.total).toBe(2)
  })

  it('POST delete and release actions', async () => {
    process.env.UPLOADS_PROVIDER = 'netlify'
    const { POST }: any = await import('@/app/api/admin/uploads/quarantine/route')

    const reqDel = new Request('https://x', { method: 'POST', body: JSON.stringify({ action: 'delete', keys: ['quarantine/uploads/a.pdf'] }) })
    const resDel: any = await POST(reqDel as any)
    expect(resDel.status).toBe(200)
    expect(providerHelpers.removeObject).toHaveBeenCalled()

    const reqRel = new Request('https://x', { method: 'POST', body: JSON.stringify({ action: 'release', keys: ['quarantine/uploads/c.pdf'] }) })
    const resRel: any = await POST(reqRel as any)
    expect(resRel.status).toBe(200)
    expect(providerHelpers.releaseFromQuarantine).toHaveBeenCalled()
  })
})
