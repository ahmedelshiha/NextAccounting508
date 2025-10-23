'use client'

import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'
import Tabs from '@/components/admin/settings/Tabs'
import { Globe } from 'lucide-react'
import { useLocalizationContext } from './LocalizationProvider'
import { TABS } from './constants'
import {
  LanguagesTab,
  OrganizationTab,
  UserPreferencesTab,
  RegionalFormatsTab,
  IntegrationTab,
  TranslationsTab,
  AnalyticsTab,
  DiscoveryTab,
} from './tabs'
import type { TabKey } from './types'

const TAB_COMPONENTS: Record<TabKey, React.ComponentType> = {
  languages: LanguagesTab,
  organization: OrganizationTab,
  'user-preferences': UserPreferencesTab,
  regional: RegionalFormatsTab,
  integration: IntegrationTab,
  translations: TranslationsTab,
  analytics: AnalyticsTab,
  discovery: DiscoveryTab,
}

export default function LocalizationContent() {
  const searchParams = useSearchParams()
  const { activeTab, setActiveTab, loading, saving, error } = useLocalizationContext()

  useEffect(() => {
    const t = searchParams.get('tab') as TabKey | null
    if (t && TABS.some(tab => tab.key === t)) {
      setActiveTab(t)
    }
  }, [searchParams, setActiveTab])

  const TabComponent = TAB_COMPONENTS[activeTab]

  return (
    <SettingsShell
      title="Localization & Language Control"
      description="Manage languages, translations, regional settings, and user language preferences"
      icon={Globe}
      showBackButton={true}
      saving={saving}
      actions={
        <FavoriteToggle
          settingKey="localization"
          route="/admin/settings/localization"
          label="Localization Settings"
        />
      }
      tabs={TABS}
      activeTab={activeTab}
      onChangeTab={(k: string) => setActiveTab(k as TabKey)}
      loading={loading}
    >
      {!loading && TabComponent && <TabComponent />}
    </SettingsShell>
  )
}
