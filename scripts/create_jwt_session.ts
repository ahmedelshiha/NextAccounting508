#!/usr/bin/env tsx

import prisma from '../src/lib/prisma'
import { encode } from 'next-auth/jwt'

async function main() {
  const email = process.argv[2] || process.env.EMAIL || 'staff@accountingfirm.com'
  const tenantSlugHint = process.argv[3] || process.env.TENANT_SLUG || null
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error('NEXTAUTH_SECRET not set')
    process.exit(1)
  }

  const user = await prisma.user.findFirst({
    where: { email },
    include: {
      tenantMemberships: { include: { tenant: true } },
    },
  })

  if (!user) {
    console.error(`User not found for email: ${email}`)
    process.exit(1)
  }

  const memberships = user.tenantMemberships || []
  const active = tenantSlugHint
    ? memberships.find((m: any) => m.tenant?.slug === tenantSlugHint)
    : memberships.find((m: any) => m.isDefault) || memberships[0] || null

  const token: any = {
    name: user.name,
    email: user.email,
    picture: user.image || null,
    sub: user.id,
    userId: user.id,
    role: user.role,
    tenantId: active?.tenantId || null,
    tenantSlug: active?.tenant?.slug || null,
    tenantRole: active?.role || null,
    availableTenants: memberships.map((m: any) => ({ id: m.tenantId, slug: m.tenant?.slug, name: m.tenant?.name, role: m.role })),
    iat: Math.floor(Date.now() / 1000),
    sessionVersion: user.sessionVersion ?? 0,
  }

  const encoded = await encode({ token, secret })
  const cookieName = '__Secure-next-auth.session-token'
  const cookie = `${cookieName}=${encoded}; Path=/; HttpOnly; Secure; SameSite=Lax`
  console.log(cookie)
}

main().catch((e) => {
  console.error('error', e)
  process.exit(1)
})
