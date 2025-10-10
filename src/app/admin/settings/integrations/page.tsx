'use client'

import React, { useEffect, useState } from 'react'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'

export default function IntegrationHubPage(){
  const [active, setActive] = useState('payments')
  const [settings, setSettings] = useState<any>({})
  const [pending, setPending] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(()=>{ load() },[])

  async function load(){
    setLoading(true)
    try { const res = await fetch('/api/admin/integration-hub', { cache: 'no-store' }); const data = await res.json(); setSettings(data.settings || {}) } finally { setLoading(false) }
  }

  function onChange(section: string, field: string, value: any){
    setPending((prev: any) => ({ ...prev, [section]: { ...(prev[section]||{}), [field]: value } }))
  }

  async function onSave(){
    setSaving(true)
    try { const res = await fetch('/api/admin/integration-hub', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) }); if (res.ok){ const data = await res.json(); setSettings(data.settings); setPending({}) } } finally { setSaving(false) }
  }

  async function testStripe(){
    setTesting(true); setTestResult(null)
    try { const res = await fetch('/api/admin/integration-hub/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'stripe', payload: { publishableKey: pending.payments?.publishableKey } }) }); const out = await res.json(); setTestResult(out.ok? 'Stripe OK' : 'Stripe failed') } finally { setTesting(false) }
  }

  async function testSendgrid(){
    setTesting(true); setTestResult(null)
    try { const res = await fetch('/api/admin/integration-hub/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'sendgrid', payload: { apiKey: pending.comms?.sendgridApiKey } }) }); const out = await res.json(); setTestResult(out.ok? 'SendGrid OK' : 'SendGrid failed') } finally { setTesting(false) }
  }

  const tabs = [
    { key: 'payments', label: 'Payments' },
    { key: 'calendars', label: 'Calendars' },
    { key: 'comms', label: 'Communications' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'storage', label: 'Storage' },
  ]

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>)

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">{testResult}</div>

      <SettingsShell title="Integration Hub" description="Connect payments, calendars, communications, analytics, and storage" tabs={tabs} activeTab={active} onChangeTab={setActive} actions={(<div className="flex items-center gap-2"><PermissionGate permission={PERMISSIONS.INTEGRATION_HUB_EDIT}><button onClick={onSave} disabled={saving || Object.keys(pending).length===0} className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">{saving? 'Saving...':'Save Changes'}</button></PermissionGate> <FavoriteToggle settingKey="integrationHub" route="/admin/settings/integrations" label="Integration Hub" /></div>)}>
        {active==='payments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select value={pending.payments?.provider ?? settings?.payments?.provider ?? 'none'} onChange={(e)=>onChange('payments','provider', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="none">None</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
              <input type="password" placeholder={settings?.payments?.publishableKeyMasked || ''} onChange={(e)=>onChange('payments','publishableKey', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
              <input type="password" placeholder={settings?.payments?.hasSecret? '���•••••••' : ''} onChange={(e)=>onChange('payments','secretKey', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Test Mode</label>
              <button onClick={()=>onChange('payments','testMode', !(pending.payments?.testMode ?? settings?.payments?.testMode ?? true))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ (pending.payments?.testMode ?? settings?.payments?.testMode ?? true) ? 'bg-blue-600':'bg-gray-200' }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ (pending.payments?.testMode ?? settings?.payments?.testMode ?? true) ? 'translate-x-6':'translate-x-1' }`}/>
              </button>
            </div>
            <PermissionGate permission={PERMISSIONS.INTEGRATION_HUB_TEST}>
              <button onClick={testStripe} disabled={testing} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">{testing? 'Testing…':'Test Stripe'}</button>
            </PermissionGate>
          </div>
        )}

        {active==='calendars' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Toggle label="Google Calendar Connected" checked={pending.calendars?.googleConnected ?? settings?.calendars?.googleConnected ?? false} onChange={(v)=>onChange('calendars','googleConnected', v)} />
            <Toggle label="Outlook Connected" checked={pending.calendars?.outlookConnected ?? settings?.calendars?.outlookConnected ?? false} onChange={(v)=>onChange('calendars','outlookConnected', v)} />
          </div>
        )}

        {active==='comms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SendGrid API Key</label>
              <input type="password" placeholder={(settings?.comms?.sendgridConfigured? '••••••••' : '')} onChange={(e)=>onChange('comms','sendgridApiKey', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <PermissionGate permission={PERMISSIONS.INTEGRATION_HUB_TEST}>
              <button onClick={testSendgrid} disabled={testing} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">{testing? 'Testing…':'Test SendGrid'}</button>
            </PermissionGate>
          </div>
        )}

        {active==='analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GA Tracking ID</label>
              <input type="password" placeholder={settings?.analytics?.gaTrackingIdMasked || ''} onChange={(e)=>onChange('analytics','gaTrackingId', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
        )}

        {active==='storage' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select value={pending.storage?.provider ?? settings?.storage?.provider ?? 'none'} onChange={(e)=>onChange('storage','provider', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="none">None</option>
                <option value="s3">S3</option>
                <option value="netlify">Netlify</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bucket</label>
              <input value={pending.storage?.bucket ?? settings?.storage?.bucket ?? ''} onChange={(e)=>onChange('storage','bucket', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
        )}
      </SettingsShell>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean)=>void }){
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button onClick={()=>onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked? 'bg-blue-600':'bg-gray-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked? 'translate-x-6':'translate-x-1'}`}/>
      </button>
    </div>
  )
}
