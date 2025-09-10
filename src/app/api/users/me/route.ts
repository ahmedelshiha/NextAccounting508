import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, role: true } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('GET /api/users/me error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const json = await request.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const updates: any = {}
    if (parsed.data.name) updates.name = parsed.data.name
    if (parsed.data.email) {
      // check uniqueness
      const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
      if (exists && exists.id !== session.user.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
      updates.email = parsed.data.email
    }
    if (parsed.data.password) {
      const hashed = await bcrypt.hash(parsed.data.password, 12)
      updates.password = hashed
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const updated = await prisma.user.update({ where: { id: session.user.id }, data: updates, select: { id: true, name: true, email: true } })

    return NextResponse.json({ user: updated })
  } catch (err) {
    console.error('PATCH /api/users/me error', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
