import { NextRequest } from 'next/server'
import { respond } from '@/lib/api-response'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CreateTemplate = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  metadata: z.any().optional(),
})

export async function GET(_req: NextRequest) {
  try {
    const rows = await prisma.template.findMany({ orderBy: { createdAt: 'desc' } })
    return respond.ok(rows)
  } catch (e) {
    console.error('GET /api/templates error', e)
    return respond.serverError('Failed to list templates')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = CreateTemplate.safeParse(body)
    if (!parsed.success) return respond.badRequest('Invalid template payload', parsed.error.format())
    const data = parsed.data
    const created = await prisma.template.create({ data })
    return respond.created(created)
  } catch (e) {
    console.error('POST /api/templates error', e)
    return respond.serverError('Failed to create template')
  }
}
