export interface LanguageRow {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  flag?: string
  bcp47Locale: string
  enabled: boolean
  featured?: boolean
  autoDetect?: boolean
}

export interface OrganizationLocalizationSettings {
  defaultLanguage: string
  fallbackLanguage: string
  showLanguageSwitcher: boolean
  persistLanguagePreference: boolean
  autoDetectBrowserLanguage: boolean
  allowUserLanguageOverride: boolean
  enableRtlSupport: boolean
  missingTranslationBehavior: 'show-key' | 'show-fallback' | 'show-empty'
}

export interface RegionalFormat {
  language: string
  dateFormat: string
  timeFormat: string
  currencyCode: string
  currencySymbol: string
  numberFormat: string
  decimalSeparator: string
  thousandsSeparator: string
}

export interface CrowdinIntegration {
  projectId: string
  apiToken: string
  autoSyncDaily: boolean
  syncOnDeploy: boolean
  createPrs: boolean
  lastSyncAt?: string | null
  lastSyncStatus?: 'success' | 'failed' | 'pending' | null
  testConnectionOk?: boolean
}

export interface TranslationStatus {
  summary: {
    totalKeys: number
    enCoveragePct: string
    arCoveragePct: string
    hiCoveragePct: string
  }
}

export interface MissingKey {
  key: string
  arTranslated?: boolean
  hiTranslated?: boolean
}

export interface AnalyticsData {
  totalUsers: number
  languagesInUse: string[]
  mostUsedLanguage?: string
  distribution: Array<{
    language: string
    count: number
    percentage: string
  }>
}

export type TabKey = 'languages' | 'organization' | 'user-preferences' | 'regional' | 'integration' | 'translations' | 'analytics' | 'discovery'

export interface TabDefinition {
  key: TabKey
  label: string
}

export interface LocalizationContextType {
  activeTab: TabKey
  setActiveTab: (tab: TabKey) => void
  languages: LanguageRow[]
  setLanguages: (langs: LanguageRow[]) => void
  orgSettings: OrganizationLocalizationSettings
  setOrgSettings: (settings: OrganizationLocalizationSettings) => void
  regionalFormats: Record<string, RegionalFormat>
  setRegionalFormats: (formats: Record<string, RegionalFormat>) => void
  crowdinIntegration: CrowdinIntegration
  setCrowdinIntegration: (integration: CrowdinIntegration) => void
  translationStatus: TranslationStatus | null
  setTranslationStatus: (status: TranslationStatus | null) => void
  missingKeys: MissingKey[]
  setMissingKeys: (keys: MissingKey[]) => void
  analyticsData: AnalyticsData | null
  setAnalyticsData: (data: AnalyticsData | null) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  saving: boolean
  setSaving: (saving: boolean) => void
  saved: boolean
  setSaved: (saved: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}
