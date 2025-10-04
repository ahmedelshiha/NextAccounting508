import type { DefaultSession, DefaultUser } from 'next-auth'

type TenantMembershipSummary = {
  id: string
  slug: string | null
  name: string | null
  role: string | null
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id?: string
      role?: string
      tenantId?: string | null
      tenantSlug?: string | null
      tenantRole?: string | null
      availableTenants?: TenantMembershipSummary[]
      tokenVersion?: number
      sessionVersion?: number
    }
    tenantId?: string | null
    tenantSlug?: string | null
    tenantRole?: string | null
    availableTenants?: TenantMembershipSummary[]
    tokenVersion?: number
    sessionVersion?: number
  }

  interface User extends DefaultUser {
    role?: string | null
    tenantId?: string | null
    tenantSlug?: string | null
    tenantRole?: string | null
    availableTenants?: TenantMembershipSummary[]
  }

  // Allow getServerSession to be treated as returning any for current codebase convenience
  export function getServerSession(...args: any[]): Promise<any>
}

declare module 'next-auth/next' {
  export function getServerSession(...args: any[]): Promise<any>
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string | null
    tenantId?: string | null
    tenantSlug?: string | null
    tenantRole?: string | null
    availableTenants?: TenantMembershipSummary[]
    sessionVersion?: number
    version?: number
    invalidated?: boolean
  }
}
