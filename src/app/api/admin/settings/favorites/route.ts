import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(async () => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await prisma.favoriteSetting.findMany({
    where: { tenantId: ctx.tenantId, userId: String(ctx.userId) },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ ok: true, data })
})

export const POST = withTenantContext(async (req: Request) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { settingKey, route, label } = body || {}
  if (!settingKey || !route || !label) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const item = await (await prisma).favoriteSetting.upsert({
    where: { tenantId_userId_settingKey: { tenantId: ctx.tenantId, userId: String(ctx.userId), settingKey } },
    update: { route, label },
    create: { tenantId: ctx.tenantId, userId: String(ctx.userId), settingKey, route, label },
  })
  return NextResponse.json({ ok: true, data: item })
})

export const DELETE = withTenantContext(async (req: Request) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const settingKey = searchParams.get('settingKey')
  if (!settingKey) return NextResponse.json({ error: 'Missing settingKey' }, { status: 400 })
  await (await prisma).favoriteSetting.delete({
    where: { tenantId_userId_settingKey: { tenantId: ctx.tenantId, userId: String(ctx.userId), settingKey } },
  })
  return NextResponse.json({ ok: true })
})
