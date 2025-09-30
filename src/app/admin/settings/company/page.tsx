import SettingsShell from '@/components/admin/settings/SettingsShell'
import dynamic from 'next/dynamic'
import React from 'react'

const GeneralTab = dynamic(() => import('@/components/admin/settings/groups/Organization/GeneralTab'))

export default function Page(){
  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'contact', label: 'Contact' },
    { key: 'localization', label: 'Localization' },
    { key: 'branding', label: 'Branding' },
    { key: 'legal', label: 'Legal' }
  ]

  return (
    <SettingsShell title="Organization Settings" description="Core business identity and operational parameters" tabs={tabs} activeTab={'general'}>
      <GeneralTab />
    </SettingsShell>
  )
}
