import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getResolvedTenantId, userByTenantEmail } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'
import { withTenantContext } from '@/lib/api-wrapper'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RegisterPayload {
  name?: string
  email?: string
  password?: string
}

function hasDatabase(): boolean {
  return Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
}

/**
 * POST /api/auth/register
 * Creates a new user in the resolved tenant and assigns CLIENT role by default.
 * Requires a configured database. When DB is absent, returns 503 to signal disabled registration.
 */
const _api_POST = async (request: NextRequest) => {
  // Refuse in environments without DB
  if (!hasDatabase()) {
    return NextResponse.json({ success: false, error: 'Registration is disabled (no database configured)' }, { status: 503 })
  }

  let body: RegisterPayload = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ success: false, error: 'Invalid input: email and password (>= 6 chars) are required' }, { status: 400 })
  }

  try {
    const tenantId = await getResolvedTenantId(request as any)
    const hashed = await bcrypt.hash(password, 12)

    // Upsert user by unique (tenantId, email)
    const user = await prisma.user.upsert({
      where: userByTenantEmail(tenantId, email),
      update: { name: name || undefined, password: hashed },
      create: { tenantId, email, name: name || null, password: hashed, role: 'CLIENT' as any },
    })

    // Ensure tenant membership exists
    await prisma.tenantMembership.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId } },
      update: { role: 'CLIENT' as any, isDefault: true },
      create: { userId: user.id, tenantId, role: 'CLIENT' as any, isDefault: true },
    })

    try { await logAudit({ action: 'auth.register', actorId: user.id, targetId: user.id, details: { tenantId } }) } catch {}

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } }, { status: 201 })
  } catch (err: any) {
    const code = String(err?.code || '')
    if (code === 'P2002') {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 })
  }
}

/**
 * Optional: document the expected payload.
 */
const _api_GET = async () => {
  return NextResponse.json({ schema: 'POST { name?:string, email:string, password:string(min 6) }' })
}

export const POST = withTenantContext(_api_POST, { requireAuth: false })
export const GET = withTenantContext(_api_GET, { requireAuth: false })
