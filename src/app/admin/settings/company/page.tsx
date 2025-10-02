'use client'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import dynamic from 'next/dynamic'
import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Tabs from '@/components/admin/settings/Tabs'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

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
  const searchParams = useSearchParams()
  useEffect(()=>{
    const t = searchParams.get('tab')
    if (t && tabList.some(tab=>tab.key===t)) setActiveTab(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any>(null)

  async function onExport(){
    const res = await fetch('/api/admin/org-settings/export')
    const data = await res.json()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `org-settings-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function onConfirmImport(){
    if (!importData) return
    const res = await fetch('/api/admin/org-settings/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(importData) })
    if (res.ok) setShowImport(false)
  }

  return (
    <SettingsShell title="Organization Settings" description="Core business identity and operational parameters" tabs={tabList} activeTab={activeTab} onChangeTab={setActiveTab}
      actions={(
        <div className="flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.ORG_SETTINGS_EXPORT}>
            <button onClick={onExport} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Export</button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.ORG_SETTINGS_IMPORT}>
            <button onClick={()=>{ setImportData(null); setShowImport(true) }} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Import</button>
          </PermissionGate>
        </div>
      )}
    >
      <Suspense fallback={<div>Loading...</div>}>
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'contact' && <ContactTab />}
        {activeTab === 'localization' && <LocalizationTab />}
        {activeTab === 'branding' && <BrandingTab />}
        {activeTab === 'legal' && <LegalTab />}
      </Suspense>

      {showImport && (
        <PermissionGate permission={PERMISSIONS.ORG_SETTINGS_IMPORT}>
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Organization Settings</h3>
              <p className="text-gray-600 mb-4">Upload a previously exported settings JSON.</p>
              <div className="space-y-4">
                <input type="file" accept="application/json" onChange={async (e)=>{
                  const file = e.target.files?.[0]
                  if (!file) return
                  try { const text = await file.text(); setImportData(JSON.parse(text)) } catch { setImportData(null) }
                }} className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50" />
                <div className="flex items-center justify-end gap-2">
                  <button onClick={()=>setShowImport(false)} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                  <button onClick={onConfirmImport} disabled={!importData} className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Import</button>
                </div>
              </div>
            </div>
          </div>
        </PermissionGate>
      )}
    </SettingsShell>
  )
}
