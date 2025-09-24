'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface AdminContextType {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  currentTenant: string | null
  userPermissions: string[]
  isLoading: boolean
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const value = useMemo<AdminContextType>(() => ({
    sidebarCollapsed,
    setSidebarCollapsed,
    currentTenant: (session?.user as any)?.tenantId ?? null,
    userPermissions: (session?.user as any)?.permissions ?? [],
    isLoading: status === 'loading'
  }), [sidebarCollapsed, session, status])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdminContext() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdminContext must be used within AdminContextProvider')
  return ctx
}
