import { NextRequest } from 'next/server'
import { respond } from '@/lib/api-response'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const UpdateTemplate = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  metadata: z.any().optional(),
})

export async function GET(_req: NextRequest, ctx: any) {
  try {
    const id = ctx.params?.id
    if (!id) return respond.badRequest('Missing id')
    const row = await prisma.template.findUnique({ where: { id } })
    if (!row) return respond.notFound('Template not found')
    return respond.ok(row)
  } catch (e) {
    console.error('GET /api/templates/[id] error', e)
    return respond.serverError('Failed to fetch template')
  }
}

export async function PATCH(req: NextRequest, ctx: any) {
  try {
    const id = ctx.params?.id
    if (!id) return respond.badRequest('Missing id')
    const body = await req.json().catch(() => ({}))
    const parsed = UpdateTemplate.safeParse(body)
    if (!parsed.success) return respond.badRequest('Invalid payload', parsed.error.format())
    const updated = await prisma.template.update({ where: { id }, data: parsed.data })
    return respond.ok(updated)
  } catch (e) {
    console.error('PATCH /api/templates/[id] error', e)
    return respond.serverError('Failed to update template')
  }
}

export async function DELETE(_req: NextRequest, ctx: any) {
  try {
    const id = ctx.params?.id
    if (!id) return respond.badRequest('Missing id')
    await prisma.template.delete({ where: { id } })
    return respond.ok({ id })
  } catch (e) {
    console.error('DELETE /api/templates/[id] error', e)
    return respond.serverError('Failed to delete template')
  }
}
