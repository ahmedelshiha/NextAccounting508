import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const Schema = z.object({
  action: z.enum(['delete','status']),
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED']).optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })

  const { action, ids, status } = parsed.data
  if (action === 'delete') {
    await prisma.requestTask.deleteMany({ where: { serviceRequestId: { in: ids } } })
    const result = await prisma.serviceRequest.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ success: true, data: { deleted: result.count } })
  }

  if (action === 'status' && status) {
    const result = await prisma.serviceRequest.updateMany({ where: { id: { in: ids } }, data: { status: status as any } })
    return NextResponse.json({ success: true, data: { updated: result.count } })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
