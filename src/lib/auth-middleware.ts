import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * requireAuth: Ensures a valid session exists and (optionally) the user has one of the allowed roles.
 * - On failure, returns a NextResponse with 401/403. Callers should `return resp` if a NextResponse is returned.
 * - On success, returns the session object.
 */
export async function requireAuth(roles: string[] = []) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Optional enforcement: require admin accounts to have 2FA enabled/verified
  // Toggle via env var ENFORCE_ORG_2FA=1 to enable; keeps default behavior unchanged.
  try {
    const enforce2fa = String(process.env.ENFORCE_ORG_2FA || '').toLowerCase() === '1' || String(process.env.ENFORCE_ORG_2FA || '').toLowerCase() === 'true'
    const role = (session.user as any)?.role as string | undefined
    if (enforce2fa && role && role.toUpperCase() === 'ADMIN') {
      const userFlags = session.user as any
      // check either twoFactorVerified or twoFactorEnabled or similar flags if present
      const has2fa = Boolean(userFlags.twoFactorVerified || userFlags.twoFactorEnabled || userFlags.mfaEnabled)
      if (!has2fa) {
        return NextResponse.json({ error: 'Two-factor authentication required for admin access' }, { status: 403 })
      }
    }
  } catch (e) {
    // fail open
  }

  if (roles.length > 0) {
    const role = (session.user as any)?.role as string | undefined
    if (!role || !roles.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  return session
}

export function isResponse(x: unknown): x is Response {
  return typeof x === 'object' && x !== null && 'body' in (x as any) && 'headers' in (x as any) && 'ok' in (x as any)
}
