"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type OrgSettings = {
  name?: string
  logoUrl?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  legalLinks?: Record<string, string> | null
  defaultLocale?: string
}

type SettingsContextValue = {
  settings: OrgSettings | null
  refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function SettingsProvider({ initialSettings, children }: { initialSettings?: OrgSettings | null; children: React.ReactNode }) {
  const [settings, setSettings] = useState<OrgSettings | null>(initialSettings ?? null)

  const refresh = async () => {
    try {
      const res = await fetch('/api/public/org-settings', { cache: 'no-store' })
      if (!res.ok) return
      const j = await res.json()
      setSettings({
        name: j.name || undefined,
        logoUrl: j.logoUrl ?? null,
        contactEmail: j.contactEmail ?? null,
        contactPhone: j.contactPhone ?? null,
        legalLinks: j.legalLinks || null,
        defaultLocale: j.defaultLocale || undefined,
      })
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    // if no initial settings, fetch once
    if (!initialSettings) {
      refresh()
    }
    const onStorage = (e: StorageEvent) => { if (e.key === 'org-settings-updated') void refresh() }
    const onCustom = () => { void refresh() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('org-settings-updated', onCustom as any)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('org-settings-updated', onCustom as any)
    }
     
  }, [])

  const value = useMemo(() => ({ settings, refresh }), [settings])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useOrgSettings(): SettingsContextValue | undefined {
  return useContext(SettingsContext)
}

// For callers that require the provider, offer a helper that throws when missing
export function useRequiredOrgSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useOrgSettings must be used within SettingsProvider')
  return ctx
}
