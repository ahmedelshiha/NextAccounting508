import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { getResolvedTenantId, userByTenantEmail, withTenant } from '@/lib/tenant'
import { registerSchema } from '@/schemas/auth'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)
    const { name, email, password } = validatedData

    // Resolve tenant and check if user already exists within tenant scope
    const tenantId = await getResolvedTenantId(request)

    const existingUser = await prisma.user.findUnique({
      where: userByTenantEmail(tenantId, String(email).toLowerCase())
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: withTenant({
        name,
        email: String(email).toLowerCase(),
        password: hashedPassword,
        role: 'CLIENT',
        emailVerified: new Date(),
      }, tenantId),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    try {
      // audit using tenant context if available
      const ctx = requireTenantContext()
      await logAudit({ action: 'admin:client:create', actorId: ctx.userId ?? null, targetId: user.id, details: { email: user.email, name: user.name } })
    } catch {}

    return NextResponse.json(
      {
        message: 'User created successfully',
        user
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
