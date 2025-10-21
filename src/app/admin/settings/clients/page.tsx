'use client'

import React, { useEffect, useMemo, useState } from 'react'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { TextField, Toggle, NumberField, SelectField } from '@/components/admin/settings/FormField'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'

type ClientSettings = {
  registration: any
  profiles: any
  communication: any
  segmentation: any
  loyalty: any
  portal: any
}

const tabs = [
  { key: 'registration', label: 'Registration' },
  { key: 'profiles', label: 'Profiles' },
  { key: 'communication', label: 'Communication' },
  { key: 'segmentation', label: 'Segmentation' },
  { key: 'loyalty', label: 'Loyalty' },
  { key: 'portal', label: 'Portal' },
]

export default function ClientManagementSettingsPage() {
  const [active, setActive] = useState<string>('registration')
  const [settings, setSettings] = useState<ClientSettings | null>(null)
  const [pending, setPending] = useState<Partial<ClientSettings>>({})
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any>(null)

  useEffect(() => { load() }, [])

  async function load(){
    const r = await fetch('/api/admin/client-settings', { cache: 'no-store' })
    if (r.ok) { const j = await r.json(); setSettings(j) }
  }

  function onChange(section: keyof ClientSettings, key: string, value: any) {
    setPending(p => ({ ...p, [section]: { ...(p as any)[section], [key]: value } }))
  }

  async function onSave() {
    if (!Object.keys(pending).length) return
    setSaving(true)
    try {
      const r = await fetch('/api/admin/client-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) })
      if (r.ok) { const j = await r.json(); setSettings(j); setPending({}) }
    } finally { setSaving(false) }
  }

  const body = useMemo(() => {
    if (!settings) return <div className="text-gray-600">Loading...</div>
    switch (active) {
      case 'registration': return (
        <section className="space-y-4">
          <Toggle label="Require Account" value={(pending.registration as any)?.requireAccount ?? settings.registration?.requireAccount ?? false} onChange={(v)=>onChange('registration','requireAccount',v)} />
          <Toggle label="Email Verification" value={(pending.registration as any)?.emailVerification ?? settings.registration?.emailVerification ?? true} onChange={(v)=>onChange('registration','emailVerification',v)} />
          <SelectField label="Duplicate Check" value={(pending.registration as any)?.duplicateCheck ?? settings.registration?.duplicateCheck ?? 'email'} onChange={(v)=>onChange('registration','duplicateCheck',v)} options={[{value:'none',label:'None'},{value:'email',label:'Email'},{value:'email+phone',label:'Email + Phone'}]} />
          <Toggle label="Collect Address" value={(pending.registration as any)?.collectAddress ?? settings.registration?.collectAddress ?? false} onChange={(v)=>onChange('registration','collectAddress',v)} />
        </section>
      )
      case 'profiles': {
        const fields = (pending.profiles as any)?.fields ?? settings.profiles?.fields ?? []
        return (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">Custom Fields</div>
              <button onClick={()=>onChange('profiles','fields',[...fields, { key:'', label:'', type:'text', required:false, visibleInPortal:true, editableByClient:true }] )} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add Field</button>
            </div>
            <div className="space-y-3">
              {fields.length===0 && <div className="text-sm text-gray-500">No fields defined.</div>}
              {fields.map((f:any, i:number) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-white border border-gray-200 rounded-lg p-3">
                  <TextField label="Key" value={f.key} onChange={(v)=>{ const next=[...fields]; next[i]={...f,key:v}; onChange('profiles','fields',next) }} />
                  <TextField label="Label" value={f.label} onChange={(v)=>{ const next=[...fields]; next[i]={...f,label:v}; onChange('profiles','fields',next) }} />
                  <SelectField label="Type" value={f.type} onChange={(v)=>{ const next=[...fields]; next[i]={...f,type:v}; onChange('profiles','fields',next) }} options={[{value:'text',label:'Text'},{value:'email',label:'Email'},{value:'phone',label:'Phone'},{value:'date',label:'Date'},{value:'number',label:'Number'}]} />
                  <div className="md:col-span-2 grid grid-cols-2 gap-3">
                    <Toggle label="Required" value={!!f.required} onChange={(v)=>{ const next=[...fields]; next[i]={...f,required:v}; onChange('profiles','fields',next) }} />
                    <Toggle label="Visible in Portal" value={!!f.visibleInPortal} onChange={(v)=>{ const next=[...fields]; next[i]={...f,visibleInPortal:v}; onChange('profiles','fields',next) }} />
                    <Toggle label="Editable by Client" value={!!f.editableByClient} onChange={(v)=>{ const next=[...fields]; next[i]={...f,editableByClient:v}; onChange('profiles','fields',next) }} />
                  </div>
                  <div className="flex items-center"><button onClick={()=>{ const next=fields.filter((_:any,idx:number)=>idx!==i); onChange('profiles','fields',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button></div>
                </div>
              ))}
            </div>
          </section>
        )
      }
      case 'communication': return (
        <section className="space-y-4">
          <Toggle label="Email Opt-in Default" value={(pending.communication as any)?.emailOptInDefault ?? settings.communication?.emailOptInDefault ?? true} onChange={(v)=>onChange('communication','emailOptInDefault',v)} />
          <Toggle label="SMS Opt-in Default" value={(pending.communication as any)?.smsOptInDefault ?? settings.communication?.smsOptInDefault ?? false} onChange={(v)=>onChange('communication','smsOptInDefault',v)} />
          <SelectField label="Preferred Channel" value={(pending.communication as any)?.preferredChannel ?? settings.communication?.preferredChannel ?? 'email'} onChange={(v)=>onChange('communication','preferredChannel',v)} options={[{value:'email',label:'Email'},{value:'sms',label:'SMS'},{value:'none',label:'None'}]} />
          <Toggle label="Marketing Opt-in Default" value={(pending.communication as any)?.marketingOptInDefault ?? settings.communication?.marketingOptInDefault ?? false} onChange={(v)=>onChange('communication','marketingOptInDefault',v)} />
        </section>
      )
      case 'segmentation': return (
        <section className="space-y-4">
          <TextField label="Tags (comma-separated)" value={((pending.segmentation as any)?.tags ?? settings.segmentation?.tags ?? []).join(', ')} onChange={(v)=>onChange('segmentation','tags', v.split(',').map(x=>x.trim()).filter(Boolean))} />
        </section>
      )
      case 'loyalty': return (
        <section className="space-y-4">
          <Toggle label="Enable Loyalty" value={(pending.loyalty as any)?.enabled ?? settings.loyalty?.enabled ?? false} onChange={(v)=>onChange('loyalty','enabled',v)} />
          <NumberField label="Points per $1" value={(pending.loyalty as any)?.pointsPerDollar ?? settings.loyalty?.pointsPerDollar ?? 0} onChange={(v)=>onChange('loyalty','pointsPerDollar',v)} />
        </section>
      )
      case 'portal': return (
        <section className="space-y-4">
          <Toggle label="Allow Document Upload" value={(pending.portal as any)?.allowDocumentUpload ?? settings.portal?.allowDocumentUpload ?? true} onChange={(v)=>onChange('portal','allowDocumentUpload',v)} />
          <Toggle label="Allow Invoice View" value={(pending.portal as any)?.allowInvoiceView ?? settings.portal?.allowInvoiceView ?? true} onChange={(v)=>onChange('portal','allowInvoiceView',v)} />
          <Toggle label="Allow Payment History" value={(pending.portal as any)?.allowPaymentHistory ?? settings.portal?.allowPaymentHistory ?? true} onChange={(v)=>onChange('portal','allowPaymentHistory',v)} />
          <TextField label="Language" value={(pending.portal as any)?.language ?? settings.portal?.language ?? 'en'} onChange={(v)=>onChange('portal','language',v)} />
          <TextField label="Timezone" value={(pending.portal as any)?.timezone ?? settings.portal?.timezone ?? 'UTC'} onChange={(v)=>onChange('portal','timezone',v)} />
        </section>
      )
      default: return null
    }
  }, [active, pending, settings])

  return (
    <PermissionGate permission={PERMISSIONS.CLIENT_SETTINGS_VIEW} fallback={<div className="p-6">You do not have access to Client Settings.</div>}>
      <SettingsShell title="Client Management" description="Registration, profiles, communication, segmentation, loyalty, and portal preferences" actions={(
        <div className="flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.CLIENT_SETTINGS_EXPORT}>
            <button onClick={async ()=>{
              const r = await fetch('/api/admin/client-settings/export'); const d = await r.json();
              const blob = new Blob([JSON.stringify(d,null,2)], { type:'application/json' }); const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = `client-settings-${new Date().toISOString().slice(0,10)}.json`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
            }} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Export</button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.CLIENT_SETTINGS_IMPORT}>
            <button onClick={()=>{ setImportData(null); setShowImport(true) }} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Import</button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.CLIENT_SETTINGS_EDIT}>
            <button onClick={onSave} disabled={saving || Object.keys(pending).length===0} className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Save Changes</button>
          </PermissionGate>
          <FavoriteToggle settingKey="clientManagement" route="/admin/settings/clients" label="Client Management" />
        </div>
      )}>
        <div className="px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <aside className="lg:col-span-1">
                <nav className="bg-white border rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Client Settings</h3>
                  <ul className="space-y-1">
                    {tabs.map(t => (
                      <li key={t.key}>
                        <button onClick={()=>setActive(t.key)} className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm ${active===t.key? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <span>{t.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
              <section className="lg:col-span-4">
                <div className="bg-white border rounded-lg p-6">
                  {body}
                </div>
              </section>
            </div>
          </div>
        </div>
      </SettingsShell>
      {showImport && (
        <PermissionGate permission={PERMISSIONS.CLIENT_SETTINGS_IMPORT}>
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Client Settings</h3>
              <p className="text-gray-600 mb-4">Upload a previously exported settings JSON.</p>
              <div className="space-y-4">
                <input type="file" accept="application/json" onChange={async (e)=>{
                  const file = e.target.files?.[0]
                  if (!file) return
                  try { const text = await file.text(); setImportData(JSON.parse(text)) } catch { setImportData(null) }
                }} className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50" />
                <div className="flex items-center justify-end gap-2">
                  <button onClick={()=>setShowImport(false)} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                  <button onClick={async ()=>{ if (!importData) return; const res = await fetch('/api/admin/client-settings/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(importData) }); if (res.ok) { await load(); setShowImport(false) } }} disabled={!importData} className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Import</button>
                </div>
              </div>
            </div>
          </div>
        </PermissionGate>
      )}
    </PermissionGate>
  )
}
