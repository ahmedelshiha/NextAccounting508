import { describe, it, expect } from 'vitest'
import { Step7Schema } from '@/schemas/clients'
import { registerSchema } from '@/schemas/auth'

describe('Client schemas', () => {
  it('Step7Schema requires gdprConsent true', () => {
    const ok = Step7Schema.safeParse({ gdprConsent: true })
    expect(ok.success).toBe(true)

    const notOk = Step7Schema.safeParse({ gdprConsent: false })
    expect(notOk.success).toBe(false)

    const missing = Step7Schema.safeParse({})
    expect(missing.success).toBe(false)
  })
})

describe('Auth register schema', () => {
  it('registerSchema validates correct data and rejects short password', () => {
    const ok = registerSchema.safeParse({ name: 'Alice', email: 'alice@example.com', password: 'secret12' })
    expect(ok.success).toBe(true)

    const short = registerSchema.safeParse({ name: 'A', email: 'a@b.c', password: '123' })
    expect(short.success).toBe(false)
  })
})
