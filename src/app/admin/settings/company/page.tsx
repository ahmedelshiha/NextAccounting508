'use client'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import dynamic from 'next/dynamic'
import React, { useState, Suspense } from 'react'
import Tabs from '@/components/admin/settings/Tabs'

const GeneralTab = dynamic(() => import('@/components/admin/settings/groups/Organization/GeneralTab'))
const ContactTab = dynamic(() => import('@/components/admin/settings/groups/Organization/ContactTab'))
const LocalizationTab = dynamic(() => import('@/components/admin/settings/groups/Organization/LocalizationTab'))
const BrandingTab = dynamic(() => import('@/components/admin/settings/groups/Organization/BrandingTab'))
const LegalTab = dynamic(() => import('@/components/admin/settings/groups/Organization/LegalTab'))

export default function Page(){
  const tabList = [
    { key: 'general', label: 'General' },
    { key: 'contact', label: 'Contact' },
    { key: 'localization', label: 'Localization' },
    { key: 'branding', label: 'Branding' },
    { key: 'legal', label: 'Legal' }
  ]

  const [activeTab, setActiveTab] = useState<string>('general')

  return (
    <SettingsShell title="Organization Settings" description="Core business identity and operational parameters" tabs={tabList} activeTab={activeTab} onChangeTab={setActiveTab}>
      <Suspense fallback={<div>Loading...</div>}>
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'contact' && <ContactTab />}
        {activeTab === 'localization' && <LocalizationTab />}
        {activeTab === 'branding' && <BrandingTab />}
        {activeTab === 'legal' && <LegalTab />}
      </Suspense>
    </SettingsShell>
  )
}
