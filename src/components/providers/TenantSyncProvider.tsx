'use client'

/**
 * Tenant Sync Provider
 * 
 * Automatically synchronizes tenant context in the background.
 * Should be placed high in the component tree, ideally wrapping the entire app.
 */

import { ReactNode } from 'react'
import { useTenantSync } from '@/hooks/useTenantSync'

interface TenantSyncProviderProps {
  children: ReactNode
}

function TenantSyncContent({ children }: TenantSyncProviderProps) {
  // Automatically sync tenant context in background
  useTenantSync()

  return <>{children}</>
}

export function TenantSyncProvider({ children }: TenantSyncProviderProps) {
  return (
    <TenantSyncContent>
      {children}
    </TenantSyncContent>
  )
}

export default TenantSyncProvider
