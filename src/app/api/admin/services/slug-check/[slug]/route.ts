import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { makeErrorBody, mapPrismaError, mapZodError, isApiError } from '@/lib/api/error-responses'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

type Ctx = { params: { slug: string } } | { params: Promise<{ slug: string }> } | any

async function resolveSlug(ctx: any): Promise<string | undefined> {
  try {
    const p = ctx?.params
    const v = p && typeof p.then === 'function' ? await p : p
    return v?.slug
  } catch { return undefined }
}

export const GET = withTenantContext(async (request: NextRequest, context: Ctx) => {
  try {
    const slug = await resolveSlug(context)
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!ctx.userId || (!hasPermission(role, PERMISSIONS.SERVICES_CREATE) && !hasPermission(role, PERMISSIONS.SERVICES_EDIT))) {
      return NextResponse.json(makeErrorBody({ code: 'FORBIDDEN', message: 'Forbidden' } as any), { status: 403 })
    }

    if (!slug) return NextResponse.json(makeErrorBody({ code: 'INVALID_SLUG', message: 'Invalid slug' } as any), { status: 400 })

    const where: any = { slug }
    if (ctx.tenantId) where.tenantId = ctx.tenantId

    const exists = await prisma.service.findFirst({ where, select: { id: true } })
    return NextResponse.json({ available: !Boolean(exists) })
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e)
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status })
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e)
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status })
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status })
    console.error('slug-check error', e)
    return NextResponse.json(makeErrorBody(e), { status: 500 })
  }
})
