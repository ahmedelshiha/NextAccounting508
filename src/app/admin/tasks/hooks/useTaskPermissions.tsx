'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

type Role = 'ADMIN' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'STAFF' | 'USER' | string

export function useTaskPermissions() {
  const { data: session } = useSession()
  const role = (session as any)?.user?.role as Role | undefined

  const perms = useMemo(() => {
    const p: Record<string, boolean> = {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canBulk: false,
      canAssign: false,
      canComment: false,
    }

    if (!role) return p

    if (role === 'ADMIN') {
      p.canCreate = p.canEdit = p.canDelete = p.canBulk = p.canAssign = p.canComment = true
      return p
    }

    if (role === 'TEAM_MEMBER' || role === 'STAFF') {
      p.canCreate = true
      p.canEdit = true
      p.canAssign = true
      p.canComment = true
      // STAFF cannot bulk delete or permanently delete tasks
      p.canDelete = false
      p.canBulk = false
      return p
    }

    if (role === 'TEAM_LEAD') {
      const p2 = { ...p }
      p2.canCreate = true
      p2.canEdit = true
      p2.canAssign = true
      p2.canComment = true
      p2.canBulk = true
      p2.canDelete = false
      return p2
    }

    if (role === 'USER') {
      p.canComment = true
      return p
    }

    return p
  }, [role])

  function hasPermission(name: keyof typeof perms) {
    return perms[name] === true
  }

  return { ...perms, hasPermission, role }
}
