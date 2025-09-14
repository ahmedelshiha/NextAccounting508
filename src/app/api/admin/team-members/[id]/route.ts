import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json().catch(() => ({}))
    const updates: any = {}
    const allowed = ['name','email','role','department','title','status','isAvailable','userId','workingHours','specialties']
    for (const k of allowed) if (k in body) updates[k] = (body as any)[k]
    const updated = await prisma.teamMember.update({ where: { id }, data: updates })
    return NextResponse.json({ teamMember: updated })
  } catch (err) {
    console.error('PUT /api/admin/team-members/[id] error', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    await prisma.teamMember.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/team-members/[id] error', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const member = await prisma.teamMember.findUnique({ where: { id } })
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ teamMember: member })
  } catch (err) {
    console.error('GET /api/admin/team-members/[id] error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
