import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CreateSchema = z.object({
  serviceId: z.string().min(1),
  title: z.string().min(5).max(300),
  description: z.string().optional(),
  priority: z.union([
    z.enum(['LOW','MEDIUM','HIGH','URGENT']),
    z.enum(['low','medium','high','urgent']).transform(v => v.toUpperCase() as 'LOW'|'MEDIUM'|'HIGH'|'URGENT'),
  ]).default('MEDIUM'),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  deadline: z.string().datetime().optional(),
  requirements: z.record(z.any()).optional(),
  attachments: z.any().optional(),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const q = searchParams.get('q')?.trim()

  const where: any = {
    clientId: session.user.id,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    }),
  }

  const [items, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        service: { select: { id: true, name: true, slug: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.serviceRequest.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Validate service exists and active
  const svc = await prisma.service.findUnique({ where: { id: data.serviceId } })
  if (!svc || svc.active === false) {
    return NextResponse.json({ error: 'Service not found or inactive' }, { status: 400 })
  }

  const created = await prisma.serviceRequest.create({
    data: {
      clientId: session.user.id,
      serviceId: data.serviceId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority as any,
      budgetMin: data.budgetMin != null ? data.budgetMin : null,
      budgetMax: data.budgetMax != null ? data.budgetMax : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      requirements: data.requirements ?? undefined,
      attachments: data.attachments ?? undefined,
      status: 'SUBMITTED',
    },
    include: {
      service: { select: { id: true, name: true, slug: true, category: true } },
    },
  })

  return NextResponse.json({ success: true, data: created }, { status: 201 })
}
