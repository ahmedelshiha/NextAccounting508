import { z } from 'zod'

export const runtime = 'edge'

const Payload = z.object({
  name: z.string().min(1).max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cadence: z.enum(['weekly', 'monthly', 'quarterly']),
  amount: z.number().min(0).max(1_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
})

function nextRuns(start: string, cadence: 'weekly' | 'monthly' | 'quarterly', count = 3): string[] {
  const base = new Date(start + 'T00:00:00Z')
  const dates: string[] = []
  const d = new Date(base)
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      if (cadence === 'weekly') d.setUTCDate(d.getUTCDate() + 7)
      if (cadence === 'monthly') d.setUTCMonth(d.getUTCMonth() + 1)
      if (cadence === 'quarterly') d.setUTCMonth(d.getUTCMonth() + 3)
    }
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = Payload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2)
  return NextResponse.json({
    success: true,
    data: {
      id,
      preview: nextRuns(data.startDate, data.cadence),
      ...data,
    }
  })
}

export async function GET() {
  return NextResponse.json({ schema: "POST { name,startDate(YYYY-MM-DD),cadence('weekly'|'monthly'|'quarterly'),amount,currency(AAA) } -> { success, data:{ id, preview:string[], ...input } }" })
}
