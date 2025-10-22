"use client"

import React, { useEffect, useMemo, useState } from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import { PERMISSIONS } from '@/lib/permissions'
import { TextField, SelectField, Toggle } from '@/components/admin/settings/FormField'

interface LanguageRow {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  flag?: string
  bcp47Locale: string
  enabled: boolean
}

export default function LanguagesSettingsPage(){
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [languages, setLanguages] = useState<LanguageRow[]>([])

  const [newLang, setNewLang] = useState<LanguageRow>({ code: '', name: '', nativeName: '', direction: 'ltr', flag: '🌐', bcp47Locale: '', enabled: true })
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Record<string, Partial<LanguageRow>>>({})

  useEffect(()=>{ load() }, [])
  async function load(){
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/admin/languages', { cache: 'no-store' })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to load languages')
      setLanguages(d.data || [])
    } catch (e:any) {
      setError(e?.message || 'Failed to load languages')
    } finally {
      setLoading(false)
    }
  }

  async function createLanguage(){
    setSaving(true); setError(null)
    try {
      const body = { ...newLang, code: newLang.code.toLowerCase() }
      const r = await fetch('/api/admin/languages', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to create language')
      setNewLang({ code: '', name: '', nativeName: '', direction: 'ltr', flag: '🌐', bcp47Locale: '', enabled: true })
      await load()
    } catch(e:any) { setError(e?.message || 'Failed to create language') } finally { setSaving(false) }
  }

  async function saveEdit(code: string){
    const changes = editing[code]
    if (!changes) return
    setSaving(true); setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, { method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(changes) })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to update language')
      setEditing(prev => { const next = { ...prev }; delete next[code]; return next })
      await load()
    } catch(e:any) { setError(e?.message || 'Failed to update language') } finally { setSaving(false) }
  }

  async function toggle(code: string){
    setSaving(true); setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}/toggle`, { method:'PATCH' })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to toggle language')
      await load()
    } catch(e:any) { setError(e?.message || 'Failed to toggle language') } finally { setSaving(false) }
  }

  async function remove(code: string){
    if (!confirm(`Delete language ${code}? This cannot be undone.`)) return
    setSaving(true); setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, { method:'DELETE' })
      const d = await r.json().catch(()=>({}))
      if (!r.ok) throw new Error((d as any)?.error || 'Failed to delete language')
      await load()
    } catch(e:any) { setError(e?.message || 'Failed to delete language') } finally { setSaving(false) }
  }

  const body = useMemo(()=>{
    if (loading) return <div className="text-gray-600">Loading...</div>
    return (
      <div className="space-y-6">
        <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
          <div className="rounded-lg border bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Add Language</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <TextField label="Code" value={newLang.code} onChange={v=>setNewLang(s=>({ ...s, code: v }))} placeholder="e.g. fr" />
              <TextField label="Name" value={newLang.name} onChange={v=>setNewLang(s=>({ ...s, name: v }))} placeholder="French" />
              <TextField label="Native Name" value={newLang.nativeName} onChange={v=>setNewLang(s=>({ ...s, nativeName: v }))} placeholder="Français" />
              <SelectField label="Direction" value={newLang.direction} onChange={v=>setNewLang(s=>({ ...s, direction: v as 'ltr'|'rtl' }))} options={[{ value:'ltr', label:'LTR' }, { value:'rtl', label:'RTL' }]} />
              <TextField label="BCP47 Locale" value={newLang.bcp47Locale} onChange={v=>setNewLang(s=>({ ...s, bcp47Locale: v }))} placeholder="fr-FR" />
              <div className="flex items-end"><button onClick={createLanguage} disabled={saving || !newLang.code || !newLang.name || !newLang.nativeName || !newLang.bcp47Locale} className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Add</button></div>
            </div>
          </div>
        </PermissionGate>

        <div className="rounded-lg border bg-white">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-600">
            <div className="col-span-2">Code</div>
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Native</div>
            <div className="col-span-2">BCP47</div>
            <div className="col-span-1">Dir</div>
            <div className="col-span-1">Enabled</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div>
            {languages.map((l)=>{
              const edit = editing[l.code] || {}
              const isEditing = !!editing[l.code]
              return (
                <div key={l.code} className="grid grid-cols-12 gap-2 px-4 py-2 border-b items-center">
                  <div className="col-span-2 text-sm font-mono">{l.code}</div>
                  <div className="col-span-2">
                    {isEditing ? (
                      <TextField label="Name" labelHidden value={edit.name ?? l.name} onChange={v=>setEditing(p=>({ ...p, [l.code]: { ...edit, name: v } }))} />
                    ) : (
                      <div className="text-sm">{l.name}</div>
                    )}
                  </div>
                  <div className="col-span-2">
                    {isEditing ? (
                      <TextField label="Native" labelHidden value={edit.nativeName ?? l.nativeName} onChange={v=>setEditing(p=>({ ...p, [l.code]: { ...edit, nativeName: v } }))} />
                    ) : (
                      <div className="text-sm">{l.nativeName}</div>
                    )}
                  </div>
                  <div className="col-span-2">
                    {isEditing ? (
                      <TextField label="BCP47" labelHidden value={edit.bcp47Locale ?? l.bcp47Locale} onChange={v=>setEditing(p=>({ ...p, [l.code]: { ...edit, bcp47Locale: v } }))} />
                    ) : (
                      <div className="text-sm">{l.bcp47Locale}</div>
                    )}
                  </div>
                  <div className="col-span-1">
                    {isEditing ? (
                      <SelectField label="Dir" labelHidden value={edit.direction ?? l.direction} onChange={v=>setEditing(p=>({ ...p, [l.code]: { ...edit, direction: v as 'ltr'|'rtl' } }))} options={[{ value:'ltr', label:'LTR' }, { value:'rtl', label:'RTL' }]} />
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{l.direction.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                      <Toggle label="" value={l.enabled} onChange={()=>toggle(l.code)} />
                    </PermissionGate>
                    <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE} fallback={<span className={`text-xs ${l.enabled? 'text-green-600':'text-gray-500'}`}>{l.enabled? 'Enabled':'Disabled'}</span>}>
                      <span />
                    </PermissionGate>
                  </div>
                  <div className="col-span-2 text-right space-x-2">
                    <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                      {!isEditing ? (
                        <button onClick={()=>setEditing(p=>({ ...p, [l.code]: {} }))} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Edit</button>
                      ) : (
                        <>
                          <button onClick={()=>saveEdit(l.code)} disabled={saving} className="px-3 py-1.5 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Save</button>
                          <button onClick={()=>setEditing(p=>{ const n={...p}; delete n[l.code]; return n })} className="ml-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                        </>
                      )}
                      <button onClick={()=>remove(l.code)} disabled={saving || l.code==='en'} className="ml-2 px-3 py-1.5 border border-red-300 rounded-md text-sm text-red-700 bg-white hover:bg-red-50 disabled:opacity-50">Delete</button>
                    </PermissionGate>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }, [loading, languages, newLang, editing, saving])

  return (
    <PermissionGate permission={PERMISSIONS.LANGUAGES_VIEW} fallback={<div className="p-6">You do not have access to Language settings.</div>}>
      <SettingsShell title="Languages" description="Manage supported languages, direction, and availability for your organization.">
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        {body}
      </SettingsShell>
    </PermissionGate>
  )
}
