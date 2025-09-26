import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

const payload = z.object({
  cost: z.number().min(0).max(100_000_000),
  monthlyBenefit: z.number().min(0).max(100_000_000),
  months: z.number().int().min(1).max(600),
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
  const { cost, monthlyBenefit, months } = parsed.data
  const totalBenefit = monthlyBenefit * months
  const roi = cost > 0 ? ((totalBenefit - cost) / cost) * 100 : 0
  const breakEvenMonths = monthlyBenefit > 0 ? Math.ceil(cost / monthlyBenefit) : null
  return NextResponse.json({ totalBenefit, roi, breakEvenMonths })
}

export async function GET() {
  return NextResponse.json({ schema: 'POST { cost:number>=0, monthlyBenefit:number>=0, months:int>=1 } -> { totalBenefit:number, roi:number, breakEvenMonths:number|null }' })
}
