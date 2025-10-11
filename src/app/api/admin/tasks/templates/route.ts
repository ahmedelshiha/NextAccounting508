import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

const DATA_PATH = path.join(process.cwd(), 'src', 'app', 'admin', 'tasks', 'data', 'templates.json')
function readTemplates() {
  try { const raw = fs.readFileSync(DATA_PATH, 'utf-8'); return JSON.parse(raw) } catch { return [] }
}
function writeTemplates(tmpls: any[]) {
  try { fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true }); fs.writeFileSync(DATA_PATH, JSON.stringify(tmpls, null, 2), 'utf-8'); return true } catch (e) { console.error('Failed to write templates', e); return false }
}

export const GET = withTenantContext(async (request?: Request) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) {
    return respond.forbidden('Forbidden')
  }
  try {
    if (!hasDb) {
      const templates = readTemplates()
      return NextResponse.json(templates)
    }

    const tenantId = ctx.tenantId
    const rows = await prisma.taskTemplate.findMany({ where: tenantFilter(tenantId), orderBy: { createdAt: 'desc' } })
    const mapped = rows.map(t => ({
      id: t.id,
      name: t.name,
      content: t.content,
      description: (t as any).description ?? null,
      category: (t as any).category ?? null,
      defaultPriority: (t as any).defaultPriority ?? 'MEDIUM',
      defaultCategory: (t as any).defaultCategory ?? null,
      estimatedHours: (t as any).estimatedHours ?? null,
      checklistItems: (t as any).checklistItems ?? [],
      requiredSkills: (t as any).requiredSkills ?? [],
      defaultAssigneeRole: (t as any).defaultAssigneeRole ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
    return NextResponse.json(mapped)
  } catch (e) {
    console.error('GET templates error', e)
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_CREATE)) {
      return respond.forbidden('Forbidden')
    }
    const body = await request.json().catch(() => ({}))

    if (!hasDb) {
      const templates = readTemplates()
      const now = new Date().toISOString()
      const id = 'tmpl_' + Math.random().toString(36).slice(2, 9)
      const t = {
        id,
        name: body.name || `Template ${templates.length+1}`,
        content: body.content || '',
        description: body.description || '',
        defaultPriority: body.defaultPriority || 'MEDIUM',
        defaultCategory: body.defaultCategory || 'system',
        estimatedHours: typeof body.estimatedHours === 'number' ? body.estimatedHours : 1,
        checklistItems: Array.isArray(body.checklistItems) ? body.checklistItems : [],
        category: body.category || null,
        requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : [],
        defaultAssigneeRole: body.defaultAssigneeRole || null,
        createdAt: now,
        updatedAt: now,
      }
      templates.unshift(t)
      writeTemplates(templates)
      return NextResponse.json(t, { status: 201 })
    }

    const tenantId = ctx.tenantId
    const created = await prisma.taskTemplate.create({
      data: {
        name: String(body.name || 'Template'),
        content: String(body.content || ''),
        description: body.description ?? null,
        category: body.category ?? null,
        defaultPriority: body.defaultPriority ?? 'MEDIUM',
        defaultCategory: body.defaultCategory ?? null,
        estimatedHours: typeof body.estimatedHours === 'number' ? body.estimatedHours : null,
        checklistItems: Array.isArray(body.checklistItems) ? body.checklistItems : [],
        requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : [],
        defaultAssigneeRole: body.defaultAssigneeRole ?? null,
        createdById: ctx.userId as string | undefined,
        ...(isMultiTenancyEnabled() && tenantId ? { tenantId } : {})
      } as any
    })
    const mapped = {
      id: created.id,
      name: created.name,
      content: created.content,
      description: (created as any).description ?? null,
      category: (created as any).category ?? null,
      defaultPriority: (created as any).defaultPriority ?? 'MEDIUM',
      defaultCategory: (created as any).defaultCategory ?? null,
      estimatedHours: (created as any).estimatedHours ?? null,
      checklistItems: (created as any).checklistItems ?? [],
      requiredSkills: (created as any).requiredSkills ?? [],
      defaultAssigneeRole: (created as any).defaultAssigneeRole ?? null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    }
    return NextResponse.json(mapped, { status: 201 })
  } catch (e) {
    console.error('Create template error', e)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_CREATE)) {
      return respond.forbidden('Forbidden')
    }
    const body = await request.json().catch(() => ({}))

    if (!hasDb) {
      const templates = readTemplates()
      const idx = templates.findIndex((t: any) => t.id === body.id)
      if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const prev = templates[idx]
      const next = {
        ...prev,
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.defaultPriority !== undefined ? { defaultPriority: body.defaultPriority } : {}),
        ...(body.defaultCategory !== undefined ? { defaultCategory: body.defaultCategory } : {}),
        ...(body.estimatedHours !== undefined ? { estimatedHours: body.estimatedHours } : {}),
        ...(Array.isArray(body.checklistItems) ? { checklistItems: body.checklistItems } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(Array.isArray(body.requiredSkills) ? { requiredSkills: body.requiredSkills } : {}),
        ...(body.defaultAssigneeRole !== undefined ? { defaultAssigneeRole: body.defaultAssigneeRole } : {}),
        updatedAt: new Date().toISOString(),
      }
      templates[idx] = next
      writeTemplates(templates)
      return NextResponse.json(next)
    }

    if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const updated = await prisma.taskTemplate.update({ where: { id: String(body.id) }, data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.content !== undefined ? { content: body.content } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.defaultPriority !== undefined ? { defaultPriority: body.defaultPriority } : {}),
      ...(body.defaultCategory !== undefined ? { defaultCategory: body.defaultCategory } : {}),
      ...(body.estimatedHours !== undefined ? { estimatedHours: body.estimatedHours } : {}),
      ...(Array.isArray(body.checklistItems) ? { checklistItems: body.checklistItems } : {}),
      ...(Array.isArray(body.requiredSkills) ? { requiredSkills: body.requiredSkills } : {}),
      ...(body.defaultAssigneeRole !== undefined ? { defaultAssigneeRole: body.defaultAssigneeRole } : {}),
    } })
    const mapped = {
      id: updated.id,
      name: updated.name,
      content: updated.content,
      description: (updated as any).description ?? null,
      category: (updated as any).category ?? null,
      defaultPriority: (updated as any).defaultPriority ?? 'MEDIUM',
      defaultCategory: (updated as any).defaultCategory ?? null,
      estimatedHours: (updated as any).estimatedHours ?? null,
      checklistItems: (updated as any).checklistItems ?? [],
      requiredSkills: (updated as any).requiredSkills ?? [],
      defaultAssigneeRole: (updated as any).defaultAssigneeRole ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    }
    return NextResponse.json(mapped)
  } catch (e) {
    console.error('Update template error', e)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) {
      return respond.forbidden('Forbidden')
    }
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    if (!hasDb) {
      const templates = readTemplates()
      const remaining = templates.filter((t: any) => t.id !== id)
      writeTemplates(remaining)
      return NextResponse.json({ ok: true })
    }

    await prisma.taskTemplate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Delete template error', e)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
})
