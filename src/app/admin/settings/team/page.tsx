'use client'

import React, { useEffect, useMemo, useState } from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import { PERMISSIONS } from '@/lib/permissions'
import { TextField, Toggle, NumberField, SelectField } from '@/components/admin/settings/FormField'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'

const tabs = [
  { key: 'structure', label: 'Structure' },
  { key: 'availability', label: 'Availability' },
  { key: 'skills', label: 'Skills' },
  { key: 'workload', label: 'Workload' },
  { key: 'performance', label: 'Performance' },
]

export default function TeamSettingsPage(){
  const [active, setActive] = useState<string>('structure')
  const [settings, setSettings] = useState<any>(null)
  const [pending, setPending] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any>(null)

  useEffect(() => { load() }, [])

  async function load(){
    const r = await fetch('/api/admin/team-settings', { cache: 'no-store' })
    if (r.ok) setSettings(await r.json())
  }

  function onChange(section: string, key: string, value: any){
    setPending(p => ({ ...p, [section]: { ...(p as any)[section], [key]: value } }))
  }

  async function onSave(){
    if (!Object.keys(pending).length) return
    setSaving(true)
    try {
      const r = await fetch('/api/admin/team-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) })
      if (r.ok) { const j=await r.json(); setSettings(j); setPending({}) }
    } finally { setSaving(false) }
  }

  const body = useMemo(() => {
    if (!settings) return <div className="text-gray-600">Loading...</div>
    switch(active){
      case 'structure': {
        const units = (pending.structure as any)?.orgUnits ?? settings.structure?.orgUnits ?? []
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">Organization units</div>
              <button onClick={()=>{ const next=[...units,{ id: undefined, name: 'New Unit', parentId: null, leadUserId: null }]; onChange('structure','orgUnits', next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add Unit</button>
            </div>
            <div className="space-y-3">
              {units.map((u:any,i:number)=> (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <TextField label="Name" value={u.name || ''} onChange={(v)=>{ const next=[...units]; next[i]={...u,name:v}; onChange('structure','orgUnits',next) }} />
                  <TextField label="Lead User ID" value={u.leadUserId||''} onChange={(v)=>{ const next=[...units]; next[i]={...u,leadUserId:v}; onChange('structure','orgUnits',next) }} />
                  <div className="col-span-1 md:col-span-1 flex items-center"><button onClick={()=>{ const next=units.filter((_:any,idx:number)=>idx!==i); onChange('structure','orgUnits',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button></div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'availability': {
        const av = (pending.availability as any) ?? settings.availability ?? {}
        return (
          <div className="space-y-4">
            <Toggle label="Allow Flexible Hours" value={av.allowFlexibleHours ?? false} onChange={(v)=>onChange('availability','allowFlexibleHours',v)} />
            <NumberField label="Minimum Hours Notice" value={av.minimumHoursNotice ?? 24} onChange={(v)=>onChange('availability','minimumHoursNotice',v)} min={0} max={168} />
            <TextField label="Timezone" value={av.defaultWorkingHours?.timezone ?? 'UTC'} onChange={(v)=>onChange('availability','defaultWorkingHours',{ ...(av.defaultWorkingHours||{}), timezone: v })} />
          </div>
        )
      }
      case 'skills': {
        const skills = (pending.skills as any)?.skills ?? settings.skills?.skills ?? []
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div className="text-sm text-gray-700">Skills</div><button onClick={()=>{ const next=[...skills,{ key:'', name:'New Skill', weight:50 }]; onChange('skills','skills',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add Skill</button></div>
            <div className="space-y-3">
              {skills.map((s:any,i:number)=> (
                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-white border border-gray-200 rounded-lg p-3">
                  <TextField label="Key" value={s.key||''} onChange={(v)=>{ const next=[...skills]; next[i]={...s,key:v}; onChange('skills','skills',next) }} />
                  <TextField label="Name" value={s.name||''} onChange={(v)=>{ const next=[...skills]; next[i]={...s,name:v}; onChange('skills','skills',next) }} />
                  <NumberField label="Weight" value={s.weight ?? 50} onChange={(v)=>{ const next=[...skills]; next[i]={...s,weight:v}; onChange('skills','skills',next) }} min={0} max={100} />
                  <div className="md:col-span-1 flex items-center"><button onClick={()=>{ const next=skills.filter((_:any,idx:number)=>idx!==i); onChange('skills','skills',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button></div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'workload': {
        const w = (pending.workload as any) ?? settings.workload ?? {}
        return (
          <div className="space-y-4">
            <SelectField label="Auto-assign Strategy" value={w.autoAssignStrategy ?? 'ROUND_ROBIN'} onChange={(v)=>onChange('workload','autoAssignStrategy',v)} options={[{value:'ROUND_ROBIN',label:'Round Robin'},{value:'LEAST_WORKLOAD',label:'Least Workload'},{value:'SKILL_MATCH',label:'Skill Match'},{value:'MANUAL',label:'Manual'}]} />
            <NumberField label="Max Concurrent Assignments" value={w.maxConcurrentAssignments ?? 5} onChange={(v)=>onChange('workload','maxConcurrentAssignments',v)} min={1} max={100} />
            <Toggle label="Consider Availability" value={w.considerAvailability ?? true} onChange={(v)=>onChange('workload','considerAvailability',v)} />
          </div>
        )
      }
      case 'performance': {
        const p = (pending.performance as any) ?? settings.performance ?? {}
        return (
          <div className="space-y-4">
            <Toggle label="Enable Metrics" value={p.enableMetrics ?? true} onChange={(v)=>onChange('performance','enableMetrics',v)} />
            <NumberField label="Metrics Window (days)" value={p.metricsWindowDays ?? 30} onChange={(v)=>onChange('performance','metricsWindowDays',v)} min={1} max={365} />
          </div>
        )
      }
      default: return null
    }
  }, [active, pending, settings])

  return (
    <PermissionGate permission={PERMISSIONS.TEAM_SETTINGS_VIEW} fallback={<div className="p-6">You do not have access to Team Settings.</div>}>
      <SettingsShell title="Team Management" description="Organizational structure, availability, skills, workload, and performance settings" actions={(<div className="flex items-center gap-2"><PermissionGate permission={PERMISSIONS.TEAM_SETTINGS_EXPORT}><button onClick={async ()=>{ const r = await fetch('/api/admin/team-settings/export'); const d = await r.json(); const blob = new Blob([JSON.stringify(d,null,2)], { type:'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `team-settings-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url) }} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Export</button></PermissionGate><PermissionGate permission={PERMISSIONS.TEAM_SETTINGS_IMPORT}><button onClick={()=>{ setImportData(null); setShowImport(true) }} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Import</button></PermissionGate><PermissionGate permission={PERMISSIONS.TEAM_SETTINGS_EDIT}><button onClick={onSave} disabled={saving || Object.keys(pending).length===0} className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Save Changes</button></PermissionGate> <FavoriteToggle settingKey="teamManagement" route="/admin/settings/team" label="Team Management" /></div>)}>
        <div className="px-4">
          <div className="max-w-7xl mx-auto">

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <aside className="lg:col-span-1">
                <nav className="bg-white border rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Team Settings</h3>
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
        {showImport && (
          <PermissionGate permission={PERMISSIONS.TEAM_SETTINGS_IMPORT}>
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Team Settings</h3>
                <p className="text-gray-600 mb-4">Upload a previously exported settings JSON.</p>
                <div className="space-y-4">
                  <input type="file" accept="application/json" onChange={async (e)=>{
                    const file = e.target.files?.[0]
                    if (!file) return
                    try { const text = await file.text(); setImportData(JSON.parse(text)) } catch { setImportData(null) }
                  }} className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50" />
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={()=>setShowImport(false)} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                    <button onClick={async ()=>{ if (!importData) return; const res = await fetch('/api/admin/team-settings/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(importData) }); if (res.ok) { await load(); setShowImport(false) } }} disabled={!importData} className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Import</button>
                  </div>
                </div>
              </div>
            </div>
          </PermissionGate>
        )}
      </SettingsShell>
    </PermissionGate>
  )
}
