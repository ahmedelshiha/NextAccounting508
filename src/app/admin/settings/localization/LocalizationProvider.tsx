'use client'

import React, { createContext, useState, useCallback, ReactNode } from 'react'
import type {
  LocalizationContextType,
  LanguageRow,
  OrganizationLocalizationSettings,
  RegionalFormat,
  CrowdinIntegration,
  TranslationStatus,
  MissingKey,
  AnalyticsData,
  TabKey,
} from './types'
import { DEFAULT_ORG_SETTINGS, DEFAULT_CROWDIN_INTEGRATION } from './constants'

export const LocalizationContext = createContext<LocalizationContextType | null>(null)

interface LocalizationProviderProps {
  children: ReactNode
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('languages')
  const [languages, setLanguages] = useState<LanguageRow[]>([])
  const [orgSettings, setOrgSettings] = useState<OrganizationLocalizationSettings>(DEFAULT_ORG_SETTINGS)
  const [regionalFormats, setRegionalFormats] = useState<Record<string, RegionalFormat>>({})
  const [crowdinIntegration, setCrowdinIntegration] = useState<CrowdinIntegration>(DEFAULT_CROWDIN_INTEGRATION)
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus | null>(null)
  const [missingKeys, setMissingKeys] = useState<MissingKey[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const value: LocalizationContextType = {
    activeTab,
    setActiveTab,
    languages,
    setLanguages,
    orgSettings,
    setOrgSettings,
    regionalFormats,
    setRegionalFormats,
    crowdinIntegration,
    setCrowdinIntegration,
    translationStatus,
    setTranslationStatus,
    missingKeys,
    setMissingKeys,
    analyticsData,
    setAnalyticsData,
    loading,
    setLoading,
    saving,
    setSaving,
    saved,
    setSaved,
    error,
    setError,
  }

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  )
}

export const useLocalizationContext = (): LocalizationContextType => {
  const context = React.useContext(LocalizationContext)
  if (!context) {
    throw new Error('useLocalizationContext must be used within LocalizationProvider')
  }
  return context
}
