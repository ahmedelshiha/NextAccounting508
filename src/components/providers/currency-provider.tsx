'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CurrencyCode, SUPPORTED_CURRENCIES } from '@/lib/currency'

interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('app.currency') as CurrencyCode | null
      if (stored && SUPPORTED_CURRENCIES.some(c => c.code === stored)) {
        setCurrencyState(stored)
      }
    } catch {}
  }, [])

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c)
    try { window.localStorage.setItem('app.currency', c) } catch {}
  }

  const value = useMemo(() => ({ currency, setCurrency }), [currency])
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
