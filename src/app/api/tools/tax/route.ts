import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { z } from 'zod'

export const runtime = 'nodejs'

const payload = z.object({
  income: z.number().min(0).max(100_000_000),
  deductions: z.number().min(0).max(100_000_000).default(0),
  rate: z.number().min(0).max(100),
})

export const POST = withTenantContext(async (req: Request) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = payload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }
  const { income, deductions, rate } = parsed.data
  const taxable = Math.max(0, income - deductions)
  const estTax = Math.max(0, taxable * (rate / 100))
  return NextResponse.json({ taxable, estTax })
}, { requireAuth: false })

export const GET = withTenantContext(async () => {
  return NextResponse.json({ schema: 'POST { income:number>=0, deductions?:number>=0, rate:number 0..100 } -> { taxable:number, estTax:number }' })
}, { requireAuth: false })
