import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { logAudit } from '@/lib/audit'
import { withTenantContext } from '@/lib/api-wrapper'
import prisma from '@/lib/prisma'
import { getResolvedTenantId, userByTenantEmail, withTenant } from '@/lib/tenant'
import { requireTenantContext } from '@/lib/tenant-utils'
import { registerSchema } from '@/schemas/auth'

/**
 * Handles tenant-aware client registrations.
 */
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    const normalizedEmail = String(email).toLowerCase()
    const tenantId = await getResolvedTenantId(request)

    const existingUser = await prisma.user.findUnique({
      where: userByTenantEmail(tenantId, normalizedEmail),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 },
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: withTenant(
        {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: 'CLIENT',
          emailVerified: new Date(),
        },
        tenantId,
      ),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    try {
      const ctx = requireTenantContext()
      await logAudit({
        action: 'admin:client:create',
        actorId: ctx.userId ?? null,
        targetId: user.id,
        details: { email: user.email, name: user.name },
      })
    } catch (auditError) {
      console.warn('Registration audit log failure', auditError)
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}, { requireAuth: false })
