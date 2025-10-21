"use client"

import React, { useEffect, useMemo, useState } from 'react'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { TextField, SelectField, Toggle, NumberField } from '@/components/admin/settings/FormField'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'

export default function CommunicationSettingsPage(){
  const [active, setActive] = useState('email')
  const [settings, setSettings] = useState<any>({})
  const [pending, setPending] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any>(null)

  useEffect(() => { load() }, [])

  async function load(){
    setLoading(true)
    try {
      const res = await fetch('/api/admin/communication-settings', { cache: 'no-store' })
      const data = await res.json()
      setSettings(data)
    } finally { setLoading(false) }
  }

  function onChange(section: string, field: string, value: any){
    setPending((prev: any) => ({ ...prev, [section]: { ...(prev[section]||{}), [field]: value } }))
  }

  function onChangeNested(section: string, nested: string, field: string, value: any){
    setPending((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev[section]||{}),
        [nested]: { ...((prev[section]||{})[nested]||{}), [field]: value },
      }
    }))
  }

  async function onSave(){
    setSaving(true)
    try {
      const res = await fetch('/api/admin/communication-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) })
      if (res.ok) { const data = await res.json(); setSettings(data); setPending({}) }
    } finally { setSaving(false) }
  }

  const tabs = useMemo(()=>[
    { key: 'email', label: 'Email' },
    { key: 'sms', label: 'SMS' },
    { key: 'chat', label: 'Live Chat' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'newsletters', label: 'Newsletters' },
    { key: 'reminders', label: 'Reminders' },
  ], [])

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>)

  const current = settings || {}

  return (
    <div className="space-y-4">
      <SettingsShell
        title="Communication Settings"
        description="Configure email, SMS, chat, notifications, newsletters, and reminders"
        tabs={tabs}
        activeTab={active}
        onChangeTab={setActive}
        actions={(
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.COMMUNICATION_SETTINGS_EXPORT}>
              <button onClick={async ()=>{
                const r = await fetch('/api/admin/communication-settings/export'); const d = await r.json();
                const blob = new Blob([JSON.stringify(d,null,2)], { type:'application/json' }); const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `communication-settings-${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
              }} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Export</button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.COMMUNICATION_SETTINGS_IMPORT}>
              <button onClick={()=>{ setImportData(null); setShowImport(true) }} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Import</button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.COMMUNICATION_SETTINGS_EDIT}>
              <button onClick={onSave} disabled={saving || Object.keys(pending).length===0} className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">{saving? 'Saving...':'Save Changes'}</button>
            </PermissionGate>
            <FavoriteToggle settingKey="communication" route="/admin/settings/communication" label="Communication" />
          </div>
        )}
      >
        {active==='email' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField label="Sender Name" value={pending.email?.senderName ?? current.email?.senderName ?? ''} onChange={(v)=>onChange('email','senderName', v)} />
            <TextField label="Sender Email" value={pending.email?.senderEmail ?? current.email?.senderEmail ?? ''} onChange={(v)=>onChange('email','senderEmail', v)} />
            <TextField label="Reply-To (optional)" value={pending.email?.replyTo ?? current.email?.replyTo ?? ''} onChange={(v)=>onChange('email','replyTo', v)} />
            <TextField label="Signature HTML" value={pending.email?.signatureHtml ?? current.email?.signatureHtml ?? ''} onChange={(v)=>onChange('email','signatureHtml', v)} />
            <Toggle label="Transactional Enabled" value={pending.email?.transactionalEnabled ?? current.email?.transactionalEnabled ?? true} onChange={(v)=>onChange('email','transactionalEnabled', v)} />
            <Toggle label="Marketing Enabled" value={pending.email?.marketingEnabled ?? current.email?.marketingEnabled ?? false} onChange={(v)=>onChange('email','marketingEnabled', v)} />
            <Toggle label="Compliance BCC" value={pending.email?.complianceBcc ?? current.email?.complianceBcc ?? false} onChange={(v)=>onChange('email','complianceBcc', v)} />
          </div>
        )}

        {active==='sms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField label="Provider" value={pending.sms?.provider ?? current.sms?.provider ?? 'none'} onChange={(v)=>onChange('sms','provider', v)} options={[{value:'none',label:'None'},{value:'twilio',label:'Twilio'},{value:'plivo',label:'Plivo'},{value:'nexmo',label:'Nexmo'},{value:'messageBird',label:'MessageBird'}]} />
            <TextField label="Sender ID" value={pending.sms?.senderId ?? current.sms?.senderId ?? ''} onChange={(v)=>onChange('sms','senderId', v)} />
            <Toggle label="Transactional Enabled" value={pending.sms?.transactionalEnabled ?? current.sms?.transactionalEnabled ?? false} onChange={(v)=>onChange('sms','transactionalEnabled', v)} />
            <Toggle label="Marketing Enabled" value={pending.sms?.marketingEnabled ?? current.sms?.marketingEnabled ?? false} onChange={(v)=>onChange('sms','marketingEnabled', v)} />
            <Toggle label="Fallback To Email" value={pending.sms?.fallbackToEmail ?? current.sms?.fallbackToEmail ?? true} onChange={(v)=>onChange('sms','fallbackToEmail', v)} />
            <TextField label="Routes (key:dest; comma-separated)" value={(pending.sms?.routes ?? current.sms?.routes ?? []).map((r:any)=>`${r.key}:${r.destination}`).join(', ')} onChange={(v)=>{
              const arr = String(v).split(',').map((s)=>s.trim()).filter(Boolean).map((p)=>{ const [key,...rest]=p.split(':'); return { key: key||'', destination: rest.join(':')||'' }})
              onChange('sms','routes', arr)
            }} />
          </div>
        )}

        {active==='chat' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Toggle label="Enabled" value={pending.chat?.enabled ?? current.chat?.enabled ?? false} onChange={(v)=>onChange('chat','enabled', v)} />
            <SelectField label="Provider" value={pending.chat?.provider ?? current.chat?.provider ?? 'none'} onChange={(v)=>onChange('chat','provider', v)} options={[{value:'none',label:'None'},{value:'intercom',label:'Intercom'},{value:'drift',label:'Drift'},{value:'zendesk',label:'Zendesk'},{value:'liveChat',label:'LiveChat'}]} />
            <SelectField label="Routing" value={pending.chat?.routing ?? current.chat?.routing ?? 'roundRobin'} onChange={(v)=>onChange('chat','routing', v)} options={[{value:'roundRobin',label:'Round Robin'},{value:'leastBusy',label:'Least Busy'},{value:'firstAvailable',label:'First Available'},{value:'manual',label:'Manual'}]} />
            <TextField label="Offline Message" value={pending.chat?.offlineMessage ?? current.chat?.offlineMessage ?? ''} onChange={(v)=>onChange('chat','offlineMessage', v)} />
            <TextField label="Working Hours Timezone" value={pending.chat?.workingHours?.timezone ?? current.chat?.workingHours?.timezone ?? 'UTC'} onChange={(v)=>onChangeNested('chat','workingHours','timezone', v)} />
            <TextField label="Working Hours Start (HH:MM)" value={pending.chat?.workingHours?.start ?? current.chat?.workingHours?.start ?? '09:00'} onChange={(v)=>onChangeNested('chat','workingHours','start', v)} />
            <TextField label="Working Hours End (HH:MM)" value={pending.chat?.workingHours?.end ?? current.chat?.workingHours?.end ?? '17:00'} onChange={(v)=>onChangeNested('chat','workingHours','end', v)} />
            <TextField label="Escalation Emails (comma-separated)" value={(pending.chat?.escalationEmails ?? current.chat?.escalationEmails ?? []).join(', ')} onChange={(v)=>onChange('chat','escalationEmails', String(v).split(',').map((x)=>x.trim()).filter(Boolean))} />
          </div>
        )}

        {active==='notifications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField label="Digest Time (HH:MM)" value={pending.notifications?.digestTime ?? current.notifications?.digestTime ?? '08:00'} onChange={(v)=>onChange('notifications','digestTime', v)} />
            <TextField label="Timezone" value={pending.notifications?.timezone ?? current.notifications?.timezone ?? 'UTC'} onChange={(v)=>onChange('notifications','timezone', v)} />
          </div>
        )}

        {active==='newsletters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Toggle label="Enabled" value={pending.newsletters?.enabled ?? current.newsletters?.enabled ?? false} onChange={(v)=>onChange('newsletters','enabled', v)} />
            <Toggle label="Double Opt-In" value={pending.newsletters?.doubleOptIn ?? current.newsletters?.doubleOptIn ?? true} onChange={(v)=>onChange('newsletters','doubleOptIn', v)} />
            <TextField label="Default Sender Name" value={pending.newsletters?.defaultSenderName ?? current.newsletters?.defaultSenderName ?? ''} onChange={(v)=>onChange('newsletters','defaultSenderName', v)} />
            <TextField label="Default Sender Email" value={pending.newsletters?.defaultSenderEmail ?? current.newsletters?.defaultSenderEmail ?? ''} onChange={(v)=>onChange('newsletters','defaultSenderEmail', v)} />
            <TextField label="Archive URL" value={pending.newsletters?.archiveUrl ?? current.newsletters?.archiveUrl ?? ''} onChange={(v)=>onChange('newsletters','archiveUrl', v)} />
            <TextField label="Topics (key:label; comma-separated)" value={(pending.newsletters?.topics ?? current.newsletters?.topics ?? []).map((t:any)=>`${t.key}:${t.label}`).join(', ')} onChange={(v)=>{
              const arr = String(v).split(',').map((s)=>s.trim()).filter(Boolean).map((p)=>{ const [key,...rest]=p.split(':'); return { key: key||'', label: rest.join(':')||'' }})
              onChange('newsletters','topics', arr)
            }} />
          </div>
        )}

        {active==='reminders' && (
          <div className="space-y-8">
            <ReminderSection title="Bookings" data={(pending.reminders?.bookings ?? current.reminders?.bookings)} onChange={(f,v)=>onChangeNested('reminders','bookings', f, v)} />
            <ReminderSection title="Invoices" data={(pending.reminders?.invoices ?? current.reminders?.invoices)} onChange={(f,v)=>onChangeNested('reminders','invoices', f, v)} />
            <ReminderSection title="Tasks" data={(pending.reminders?.tasks ?? current.reminders?.tasks)} onChange={(f,v)=>onChangeNested('reminders','tasks', f, v)} />
          </div>
        )}
      </SettingsShell>

      {showImport && (
        <PermissionGate permission={PERMISSIONS.COMMUNICATION_SETTINGS_IMPORT}>
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Communication Settings</h3>
              <p className="text-gray-600 mb-4">Upload a previously exported settings JSON.</p>
              <div className="space-y-4">
                <input type="file" accept="application/json" onChange={async (e)=>{
                  const file = e.target.files?.[0]
                  if (!file) return
                  try { const text = await file.text(); setImportData(JSON.parse(text)) } catch { setImportData(null) }
                }} className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50" />
                <div className="flex items-center justify-end gap-2">
                  <button onClick={()=>setShowImport(false)} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                  <button onClick={async ()=>{ if (!importData) return; const res = await fetch('/api/admin/communication-settings/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(importData) }); if (res.ok) { await load(); setShowImport(false) } }} disabled={!importData} className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Import</button>
                </div>
              </div>
            </div>
          </div>
        </PermissionGate>
      )}
    </div>
  )
}

function ReminderSection({ title, data, onChange }:{ title:string; data:any; onChange:(field:string,value:any)=>void }){
  const channels = Array.isArray(data?.channels)? data.channels : ['email']
  const has = (c:string)=> channels.includes(c)
  const toggleChannel = (c:string)=>{
    const next = has(c) ? channels.filter((x:string)=>x!==c) : [...channels, c]
    onChange('channels', next)
  }
  return (
    <div className="border rounded-md p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Toggle label="Enabled" value={data?.enabled ?? true} onChange={(v)=>onChange('enabled', v)} />
        <NumberField label="Offset Hours" value={data?.offsetHours ?? 24} onChange={(v)=>onChange('offsetHours', v)} />
        <TextField label="Template ID" value={data?.templateId ?? ''} onChange={(v)=>onChange('templateId', v)} />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-2">
        <Toggle label="Email" value={has('email')} onChange={()=>toggleChannel('email')} />
        <Toggle label="SMS" value={has('sms')} onChange={()=>toggleChannel('sms')} />
        <Toggle label="Push" value={has('push')} onChange={()=>toggleChannel('push')} />
      </div>
    </div>
  )
}
