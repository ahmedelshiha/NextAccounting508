import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { respond, zodDetails } from '@/lib/api-response'

async function readJson(resp: Response) {
  const j = await resp.json().catch(() => null)
  return j as any
}

describe('api-response helpers', () => {
  it('ok returns 200 with success true and data', async () => {
    const data = { x: 1 }
    const res = respond.ok(data)
    expect(res.status).toBe(200)
    const j = await readJson(res)
    expect(j).toMatchObject({ success: true, data })
  })

  it('ok includes meta fields', async () => {
    const res = respond.ok({ a: 1 }, { pagination: { page: 1 } })
    const j = await readJson(res)
    expect(j.pagination).toEqual({ page: 1 })
  })

  it('created returns 201', async () => {
    const res = respond.created({ id: '1' })
    expect(res.status).toBe(201)
    const j = await readJson(res)
    expect(j.success).toBe(true)
  })

  it('badRequest returns 400 with error shape', async () => {
    const res = respond.badRequest('Invalid', { foo: 'bar' })
    expect(res.status).toBe(400)
    const j = await readJson(res)
    expect(j).toMatchObject({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid' } })
    expect(j.error.details).toBeDefined()
  })

  it('unauthorized/forbidden/notFound/tooMany/serverError statuses and codes', async () => {
    const u = await readJson(respond.unauthorized())
    expect(u).toMatchObject({ success: false, error: { code: 'UNAUTHORIZED' } })

    const f = await readJson(respond.forbidden())
    expect(f).toMatchObject({ success: false, error: { code: 'FORBIDDEN' } })

    const n = await readJson(respond.notFound())
    expect(n).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } })

    const t = await readJson(respond.tooMany())
    expect(t).toMatchObject({ success: false, error: { code: 'TOO_MANY_REQUESTS' } })

    const s = await readJson(respond.serverError())
    expect(s).toMatchObject({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } })
  })
})

describe('zodDetails', () => {
  it('returns flatten() output for ZodError', () => {
    const schema = z.object({ name: z.string().min(2) })
    const parsed = schema.safeParse({ name: '' })
    expect(parsed.success).toBe(false)
    const details = zodDetails(parsed.error)
    expect(details && typeof details).toBe('object')
    expect((details as any).fieldErrors?.name).toBeTruthy()
  })
})
