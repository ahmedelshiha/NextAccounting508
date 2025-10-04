import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// GET /api/bookings/[id]/comments - Get comments for a booking
export const GET = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const ctx = requireTenantContext()
    if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true, clientId: true, status: true } })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (ctx.role === 'CLIENT' && booking.clientId !== ctx.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const comments: any[] = []
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching booking comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// POST /api/bookings/[id]/comments - Create a comment for a booking
export const POST = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const ctx = requireTenantContext()
    if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { content, isInternal = false, isSystem = false, parentId = null, attachments = null } = body

    if (!content?.trim() && !isSystem) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true, clientId: true, status: true } })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (ctx.role === 'CLIENT') {
      if (booking.clientId !== ctx.userId || isInternal) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (isInternal && !hasPermission(ctx.role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Insufficient permissions for internal comments' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Booking comments feature is not yet implemented' }, { status: 501 })
  } catch (error) {
    console.error('Error creating booking comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
