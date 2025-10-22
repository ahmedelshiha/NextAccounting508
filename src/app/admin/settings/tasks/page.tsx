'use client'

import React, { useEffect, useMemo, useState } from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import { PERMISSIONS } from '@/lib/permissions'
import { TextField, Toggle, NumberField, SelectField } from '@/components/admin/settings/FormField'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'

const tabs = [
  { key: 'templates', label: 'Templates' },
  { key: 'statuses', label: 'Statuses' },
  { key: 'automation', label: 'Automation' },
  { key: 'board', label: 'Board' },
  { key: 'dependencies', label: 'Dependencies' },
]

export default function TaskWorkflowSettingsPage(){
  const [active, setActive] = useState<string>('templates')
  const [settings, setSettings] = useState<any>(null)
  const [pending, setPending] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any>(null)

  useEffect(()=>{ load() }, [])
  async function load(){ const r = await fetch('/api/admin/task-settings', { cache: 'no-store' }); if (r.ok) setSettings(await r.json()) }

  function onChange(section: string, key: string, value: any){ setPending(p => ({ ...p, [section]: { ...(p as any)[section], [key]: value } })) }

  async function onSave(){ if (!Object.keys(pending).length) return; setSaving(true); try { const r = await fetch('/api/admin/task-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) }); if (r.ok) { setSettings(await r.json()); setPending({}) } } finally { setSaving(false) } }

  const body = useMemo(()=>{
    if (!settings) return <div className="text-gray-600">Loading...</div>
    switch(active){
      case 'templates': {
        const templates = (pending.templates as any) ?? settings.templates ?? []
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div className="text-sm text-gray-700">Task templates</div><button onClick={()=>{ const next=[...templates,{ id: undefined, name: 'New Template', description: '' }]; onChange('templates','templates',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add Template</button></div>
            <div className="space-y-3">
              {templates.map((t:any,i:number)=> (
                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-white border border-gray-200 rounded-lg p-3">
                  <TextField label="Name" value={t.name||''} onChange={(v)=>{ const next=[...templates]; next[i]={...t,name:v}; onChange('templates','templates',next) }} />
                  <TextField label="Description" value={t.description||''} onChange={(v)=>{ const next=[...templates]; next[i]={...t,description:v}; onChange('templates','templates',next) }} />
                  <div className="md:col-span-1 flex items-center"><button onClick={()=>{ const next=templates.filter((_:any,idx:number)=>idx!==i); onChange('templates','templates',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button></div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'statuses': {
        const statuses = (pending.statuses as any) ?? settings.statuses ?? []
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div className="text-sm text-gray-700">Statuses</div><button onClick={()=>{ const next=[...statuses,{ key:'new', label:'New Status', order: statuses.length }]; onChange('statuses','statuses',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add Status</button></div>
            <div className="space-y-3">
              {statuses.map((s:any,i:number)=> (
                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-white border border-gray-200 rounded-lg p-3">
                  <TextField label="Key" value={s.key||''} onChange={(v)=>{ const next=[...statuses]; next[i]={...s,key:v}; onChange('statuses','statuses',next) }} />
                  <TextField label="Label" value={s.label||''} onChange={(v)=>{ const next=[...statuses]; next[i]={...s,label:v}; onChange('statuses','statuses',next) }} />
                  <TextField label="Color" value={s.color||''} onChange={(v)=>{ const next=[...statuses]; next[i]={...s,color:v}; onChange('statuses','statuses',next) }} />
                  <div className="md:col-span-1 flex items-center"><button onClick={()=>{ const next=statuses.filter((_:any,idx:number)=>idx!==i); onChange('statuses','statuses',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button></div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'automation': {
        const rules = (pending.automation as any) ?? settings.automation ?? []
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div className="text-sm text-gray-700">Automation rules</div><button onClick={()=>{ const next=[...rules,{ id: undefined, name:'New Rule', trigger:'', condition:'', actions:[], enabled:true }]; onChange('automation','automation',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add Rule</button></div>
            <div className="space-y-3">
              {rules.map((r:any,i:number)=> (
                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-white border border-gray-200 rounded-lg p-3">
                  <TextField label="Name" value={r.name||''} onChange={(v)=>{ const next=[...rules]; next[i]={...r,name:v}; onChange('automation','automation',next) }} />
                  <TextField label="Trigger" value={r.trigger||''} onChange={(v)=>{ const next=[...rules]; next[i]={...r,trigger:v}; onChange('automation','automation',next) }} />
                  <TextField label="Actions (comma)" value={(r.actions||[]).join(', ')} onChange={(v)=>{ const next=[...rules]; next[i]={...r,actions:v.split(',').map((s:string)=>s.trim()).filter(Boolean)}; onChange('automation','automation',next) }} />
                  <div className="md:col-span-1 flex items-center"><button onClick={()=>{ const next=rules.filter((_:any,idx:number)=>idx!==i); onChange('automation','automation',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button></div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'board': {
        const board = (pending.board as any) ?? settings.board ?? {}
        return (
          <div className="space-y-4">
            <Toggle label="Show completed in board" value={board.showCompletedInBoard ?? false} onChange={(v)=>onChange('board','showCompletedInBoard',v)} />
            <div className="space-y-3">
              <div className="flex items-center justify-between"><div className="text-sm text-gray-700">Swimlanes</div><button onClick={()=>{ const next=[...(board.swimlanes||[]), { id: undefined, title: 'New Lane', query: '' }]; onChange('board','swimlanes',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add Lane</button></div>
              {(board.swimlanes||[]).map((l:any,i:number)=> (
                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-white border border-gray-200 rounded-lg p-3">
                  <TextField label="Title" value={l.title||''} onChange={(v)=>{ const next=[...(board.swimlanes||[])]; next[i]={...l,title:v}; onChange('board','swimlanes',next) }} />
                  <TextField label="Query" value={l.query||''} onChange={(v)=>{ const next=[...(board.swimlanes||[])]; next[i]={...l,query:v}; onChange('board','swimlanes',next) }} />
                  <div className="md:col-span-1 flex items-center"><button onClick={()=>{ const next=(board.swimlanes||[]).filter((_:any,idx:number)=>idx!==i); onChange('board','swimlanes',next) }} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button></div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'dependencies': {
        const deps = (pending.dependenciesEnabled as any) ?? settings.dependenciesEnabled ?? true
        return (
          <div className="space-y-4">
            <Toggle label="Enable Task Dependencies" value={deps} onChange={(v)=>onChange('','dependenciesEnabled',v)} />
          </div>
        )
      }
      default: return null
    }
  }, [active, pending, settings])

  return (
    <PermissionGate permission={PERMISSIONS.TASK_WORKFLOW_SETTINGS_VIEW} fallback={<div className="p-6">You do not have access to Task & Workflow settings.</div>}>
      <SettingsShell title="Task & Workflow" description="Templates, statuses, automation, and board configuration for tasks" actions={(
        <div className="flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.TASK_WORKFLOW_SETTINGS_EXPORT}>
            <button onClick={async ()=>{
              const r = await fetch('/api/admin/task-settings/export'); const d = await r.json();
              const blob = new Blob([JSON.stringify(d,null,2)], { type:'application/json' }); const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = `task-settings-${new Date().toISOString().slice(0,10)}.json`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
            }} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Export</button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.TASK_WORKFLOW_SETTINGS_IMPORT}>
            <button onClick={()=>{ setImportData(null); setShowImport(true) }} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Import</button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.TASK_WORKFLOW_SETTINGS_EDIT}>
            <button onClick={onSave} disabled={saving || Object.keys(pending).length===0} className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Save Changes</button>
          </PermissionGate>
          <FavoriteToggle settingKey="taskWorkflow" route="/admin/settings/tasks" label="Task & Workflow" />
        </div>
      )}>
        <div className="px-4">
          <div className="max-w-7xl mx-auto">

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <aside className="lg:col-span-1">
                <nav className="bg-white border rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Task & Workflow</h3>
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
          <PermissionGate permission={PERMISSIONS.TASK_WORKFLOW_SETTINGS_IMPORT}>
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Task & Workflow Settings</h3>
                <p className="text-gray-600 mb-4">Upload a previously exported settings JSON.</p>
                <div className="space-y-4">
                  <input type="file" accept="application/json" onChange={async (e)=>{
                    const file = e.target.files?.[0]
                    if (!file) return
                    try { const text = await file.text(); setImportData(JSON.parse(text)) } catch { setImportData(null) }
                  }} className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50" />
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={()=>setShowImport(false)} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                    <button onClick={async ()=>{ if (!importData) return; const res = await fetch('/api/admin/task-settings/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(importData) }); if (res.ok) { await load(); setShowImport(false) } }} disabled={!importData} className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Import</button>
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
