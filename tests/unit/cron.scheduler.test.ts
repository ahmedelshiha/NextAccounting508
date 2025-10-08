import { describe, it, expect } from 'vitest'
import { authorizeCron, runCronTask } from '@/lib/cron/scheduler'

function mkReq(headers: Record<string,string> = {}) {
  return new Request('http://localhost/api/cron', { headers }) as any
}

describe('cron scheduler', () => {
  it('authorizeCron allows when no secret configured', () => {
    const prev1 = process.env.CRON_SECRET
    const prev2 = process.env.NEXT_CRON_SECRET
    delete process.env.CRON_SECRET
    delete process.env.NEXT_CRON_SECRET
    const res = authorizeCron(mkReq())
    expect(res).toBeNull()
    process.env.CRON_SECRET = prev1
    process.env.NEXT_CRON_SECRET = prev2
  })

  it('authorizeCron rejects with wrong secret', () => {
    const prev = process.env.CRON_SECRET
    process.env.CRON_SECRET = 's3cret'
    const res = authorizeCron(mkReq({ authorization: 'Bearer nope' }))
    expect(res?.status).toBe(401)
    process.env.CRON_SECRET = prev
  })

  it('authorizeCron accepts with correct bearer', () => {
    const prev = process.env.CRON_SECRET
    process.env.CRON_SECRET = 's3cret'
    const res = authorizeCron(mkReq({ authorization: 'Bearer s3cret' }))
    expect(res).toBeNull()
    process.env.CRON_SECRET = prev
  })

  it('runCronTask returns success payload', async () => {
    const out = await runCronTask('demo', async () => 42)
    expect(out.success).toBe(true)
    expect(out.task).toBe('demo')
    expect(out.data).toBe(42)
    expect(typeof out.durationMs).toBe('number')
  })

  it('runCronTask returns error payload', async () => {
    const out = await runCronTask('err', async () => { throw new Error('boom') })
    expect(out.success).toBe(false)
    expect(out.task).toBe('err')
    expect(String(out.error)).toContain('boom')
  })
})
