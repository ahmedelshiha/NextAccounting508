import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

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
    const changingEmail = parsed.data.email && parsed.data.email !== undefined
    const changingPassword = parsed.data.password && parsed.data.password !== undefined

    // If changing sensitive data, require currentPassword
    if ((changingEmail || changingPassword) && !parsed.data.currentPassword) {
      return NextResponse.json({ error: 'Current password is required to change email or password' }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, password: true, email: true } })
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if ((changingEmail || changingPassword)) {
      if (!currentUser.password) {
        return NextResponse.json({ error: 'No local password set for this account' }, { status: 400 })
      }
      const ok = await bcrypt.compare(parsed.data.currentPassword, currentUser.password)
      if (!ok) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 })
      }
    }

    if (parsed.data.name) updates.name = parsed.data.name
    if (changingEmail) {
      // check uniqueness
      const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
      if (exists && exists.id !== session.user.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
      updates.email = parsed.data.email
    }
    if (changingPassword) {
      const hashed = await bcrypt.hash(parsed.data.password, 12)
      updates.password = hashed
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    // Increment sessionVersion to invalidate existing JWTs
    const updated = await prisma.user.update({ where: { id: session.user.id }, data: { ...updates, sessionVersion: { increment: 1 } }, select: { id: true, name: true, email: true, sessionVersion: true } })

    await logAudit({ action: 'user.profile.update', actorId: session.user.id, targetId: updated.id, details: { updatedFields: Object.keys(updates) } })

    return NextResponse.json({ user: updated })
  } catch (err) {
    console.error('PATCH /api/users/me error', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const body = await request.json().catch(() => ({})) as { password?: string }
    const password = body.password
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Fetch user including password hash
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, password: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (!user.password) {
      // User signed up with OAuth or has no password set
      return NextResponse.json({ error: 'No local password set for this account. Please contact support.' }, { status: 400 })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    const userId = session.user.id

    // Delete the user. Cascades will remove related accounts, sessions, bookings, etc.
    await prisma.user.delete({ where: { id: userId } })

    await logAudit({ action: 'user.delete', actorId: userId, targetId: userId })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/users/me error', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
