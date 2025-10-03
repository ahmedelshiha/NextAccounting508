import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { getTenantFromRequest } from '@/lib/tenant'
import { resolveTenantId } from '@/lib/default-tenant'

import { registerSchema } from '@/schemas/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    const { name, email, password } = validatedData

    // Resolve tenant and check if user already exists within tenant scope
    const tenantHint = getTenantFromRequest(request as any)
    const tenantId = await resolveTenantId(tenantHint)

    const existingUser = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } }
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
      data: {
        tenantId,
        name,
        email,
        password: hashedPassword,
        role: 'CLIENT',
        emailVerified: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    try {
      const session = await getServerSession(authOptions)
      await logAudit({ action: 'admin:client:create', actorId: session?.user?.id ?? null, targetId: user.id, details: { email: user.email, name: user.name } })
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
}
