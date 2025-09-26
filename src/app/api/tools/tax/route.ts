import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

const payload = z.object({
  income: z.number().min(0).max(100_000_000),
  deductions: z.number().min(0).max(100_000_000).default(0),
  rate: z.number().min(0).max(100),
})

export async function POST(req: Request) {
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
}

export async function GET() {
  return NextResponse.json({ schema: 'POST { income:number>=0, deductions?:number>=0, rate:number 0..100 } -> { taxable:number, estTax:number }' })
}
