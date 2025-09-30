'use client'

import React, { useEffect, useMemo, useState } from 'react'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { TextField, Toggle } from '@/components/admin/settings/FormField'

const tabs = [
  { key: 'dashboards', label: 'Dashboards' },
  { key: 'metrics', label: 'Metrics' },
  { key: 'exports', label: 'Exports' },
  { key: 'retention', label: 'Data Retention' },
  { key: 'integrations', label: 'Integrations' },
]

export default function AnalyticsSettingsPage(){
  const [active, setActive] = useState<string>('dashboards')
  const [settings, setSettings] = useState<any>(null)
  const [pending, setPending] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(()=>{ (async ()=>{ const r = await fetch('/api/admin/analytics-settings', { cache: 'no-store' }); if (r.ok) setSettings(await r.json()) })() }, [])

  function onChange(section: string, key: string, value: any){ setPending(p => ({ ...p, [section]: { ...(p as any)[section], [key]: value } })) }

  async function onSave(){ if (!Object.keys(pending).length) return; setSaving(true); try { const r = await fetch('/api/admin/analytics-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) }); if (r.ok) { setSettings(await r.json()); setPending({}) } } finally { setSaving(false) } }

  const body = useMemo(()=>{
    if (!settings) return <div className="text-gray-600">Loading...</div>
    switch(active){
      case 'dashboards': {
        const boards = (pending.dashboards as any) ?? settings.dashboards ?? []
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div className="text-sm text-gray-700">Dashboards</div><button onClick={()=>{ const next=[...boards,{ id: undefined, name: 'New Dashboard', widgets: [] }]; onChange('dashboards','dashboards',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add</button></div>
            <div className="space-y-3">{boards.map((b:any,i:number)=> (
              <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-white border border-gray-200 rounded-lg p-3">
                <TextField label="Name" value={b.name||''} onChange={(v)=>{ const next=[...boards]; next[i]={...b,name:v}; onChange('dashboards','dashboards',next) }} />
                <div className="md:col-span-1 flex items-center"><button onClick={()=>{ const next=boards.filter((_:any,idx:number)=>idx!==i); onChange('dashboards','dashboards',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button></div>
              </div>
            ))}</div>
          </div>
        )
      }
      case 'metrics': {
        const metrics = (pending.metrics as any) ?? settings.metrics ?? []
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div className="text-sm text-gray-700">Metrics</div><button onClick={()=>{ const next=[...metrics,{ id: undefined, key: 'new_metric', label: 'New Metric', aggregation: 'count' }]; onChange('metrics','metrics',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add</button></div>
            <div className="space-y-3">{metrics.map((m:any,i:number)=> (
              <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-white border border-gray-200 rounded-lg p-3">
                <TextField label="Key" value={m.key||''} onChange={(v)=>{ const next=[...metrics]; next[i]={...m,key:v}; onChange('metrics','metrics',next) }} />
                <TextField label="Label" value={m.label||''} onChange={(v)=>{ const next=[...metrics]; next[i]={...m,label:v}; onChange('metrics','metrics',next) }} />
                <div className="md:col-span-1 flex items-center"><button onClick={()=>{ const next=metrics.filter((_:any,idx:number)=>idx!==i); onChange('metrics','metrics',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button></div>
              </div>
            ))}</div>
          </div>
        )
      }
      case 'exports': {
        const ex = (pending.exportsEnabled as any) ?? settings.exportsEnabled ?? true
        return (<div className="space-y-4"><Toggle label="Enable Exports" value={ex} onChange={(v)=>onChange('', 'exportsEnabled', v)} /></div>)
      }
      case 'retention': {
        const dr = (pending.dataRetentionDays as any) ?? settings.dataRetentionDays ?? 365
        return (<div className="space-y-4"><TextField label="Data Retention (days)" value={String(dr)} onChange={(v)=>onChange('', 'dataRetentionDays', parseInt(v)||365)} /></div>)
      }
      case 'integrations': {
        const ints = (pending.integrations as any) ?? settings.integrations ?? []
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div className="text-sm text-gray-700">Integrations</div><button onClick={()=>{ const next=[...ints,'']; onChange('integrations','integrations',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add</button></div>
            <div className="space-y-3">{ints.map((it:any,i:number)=> (
              <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-white border border-gray-200 rounded-lg p-3">
                <TextField label="Integration ID" value={it||''} onChange={(v)=>{ const next=[...ints]; next[i]=v; onChange('integrations','integrations',next) }} />
                <div className="md:col-span-1 flex items-center"><button onClick={()=>{ const next=ints.filter((_:any,idx:number)=>idx!==i); onChange('integrations','integrations',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button></div>
              </div>
            ))}</div>
          </div>
        )
      }
      default: return null
    }
  }, [active, pending, settings])

  return (
    <PermissionGate permission={PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_VIEW} fallback={<div className="p-6">You do not have access to Analytics & Reporting settings.</div>}>
      <div className="px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
              <p className="text-gray-600">Dashboards, metrics, exports, and retention</p>
            </div>
            <div className="flex items-center gap-3">
              <PermissionGate permission={PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_EDIT}>
                <button onClick={onSave} disabled={saving || Object.keys(pending).length===0} className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Save Changes</button>
              </PermissionGate>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <aside className="lg:col-span-1">
              <nav className="bg-white border rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Analytics & Reporting</h3>
                <ul className="space-y-1">
                  {tabs.map(t=> (
                    <li key={t.key}><button onClick={()=>setActive(t.key)} className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm ${active===t.key? 'bg-blue-50 text-blue-700 font-medium':'text-gray-700 hover:bg-gray-50'}`}>{t.label}</button></li>
                  ))}
                </ul>
              </nav>
            </aside>

            <section className="lg:col-span-4">
              <div className="bg-white border rounded-lg p-6">{body}</div>
            </section>
          </div>
        </div>
      </div>
    </PermissionGate>
  )
}
