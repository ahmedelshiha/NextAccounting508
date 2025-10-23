import type { TabDefinition, OrganizationLocalizationSettings, RegionalFormat, CrowdinIntegration } from './types'

export const TABS: TabDefinition[] = [
  { key: 'languages', label: 'Languages & Availability' },
  { key: 'organization', label: 'Organization Settings' },
  { key: 'user-preferences', label: 'User Language Control' },
  { key: 'regional', label: 'Regional Formats' },
  { key: 'integration', label: 'Translation Platforms' },
  { key: 'translations', label: 'Translation Dashboard' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'discovery', label: 'Key Discovery' },
]

export const DEFAULT_ORG_SETTINGS: OrganizationLocalizationSettings = {
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  showLanguageSwitcher: true,
  persistLanguagePreference: true,
  autoDetectBrowserLanguage: true,
  allowUserLanguageOverride: true,
  enableRtlSupport: true,
  missingTranslationBehavior: 'show-fallback',
}

export const DEFAULT_REGIONAL_FORMAT: RegionalFormat = {
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: 'HH:MM AM',
  currencyCode: 'USD',
  currencySymbol: '$',
  numberFormat: '#,##0.00',
  decimalSeparator: '.',
  thousandsSeparator: ',',
}

export const DEFAULT_CROWDIN_INTEGRATION: CrowdinIntegration = {
  projectId: '',
  apiToken: '',
  autoSyncDaily: true,
  syncOnDeploy: false,
  createPrs: true,
}

export const REGIONAL_FORMAT_PRESETS: Record<string, RegionalFormat> = {
  'en-US': {
    language: 'en-US',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12:34 AM',
    currencyCode: 'USD',
    currencySymbol: '$',
    numberFormat: '#,##0.00',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'en-GB': {
    language: 'en-GB',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12:34',
    currencyCode: 'GBP',
    currencySymbol: '£',
    numberFormat: '#,##0.00',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'de-DE': {
    language: 'de-DE',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '12:34',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '#,##0.00',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  'fr-FR': {
    language: 'fr-FR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12:34',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '#,##0.00',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
  },
  'ar-AE': {
    language: 'ar-AE',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '14:34',
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    numberFormat: '#,##0.00',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  'hi-IN': {
    language: 'hi-IN',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '14:34',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '#,##,##0.00',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'ja-JP': {
    language: 'ja-JP',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '14:34',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    numberFormat: '#,##0',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'zh-CN': {
    language: 'zh-CN',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '14:34',
    currencyCode: 'CNY',
    currencySymbol: '¥',
    numberFormat: '#,##0.00',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
}

export const SAMPLE_DATE_FORMATS = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'DD.MM.YYYY',
  'YYYY/MM/DD',
]

export const SAMPLE_TIME_FORMATS = [
  'HH:MM AM',
  'HH:MM',
  'HH:MM:SS',
  'h:MM A',
]

export const CURRENCY_PRESETS = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
]
