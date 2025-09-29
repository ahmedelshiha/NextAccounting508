'use client'

'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { hasPermission, type Permission } from '@/lib/permissions'

interface PermissionGateProps {
  permission: Permission | Permission[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const perms = Array.isArray(permission) ? permission : [permission]
  const allowed = perms.some((p) => hasPermission(role, p))
  return allowed ? <>{children}</> : <>{fallback}</>
}

export default PermissionGate
