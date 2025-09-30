'use client'
import React, { useEffect, useState } from 'react'
import { Settings as SettingsIcon, CreditCard, Clock, Calendar, Bell, Users, Shield, Zap, Download, RefreshCw, Save, AlertTriangle, CheckCircle, Plug, Gauge, ListChecks, Upload } from 'lucide-react'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

/**
 * BookingSettingsPanel provides a tabbed admin UI to configure booking settings.
 * - Loads settings from /api/admin/booking-settings
 * - Tracks local changes per section
 * - Validates and persists via PUT /api/admin/booking-settings
 */
export default function BookingSettingsPanel() {
  const [active, setActive] = useState<'general'|'payments'|'steps'|'availability'|'notifications'|'customers'|'assignments'|'pricing'|'automation'|'integrations'|'capacity'|'forms'>('general')
  const [settings, setSettings] = useState<any>(null)
  const [pending, setPending] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ message: string }[]>([])
  const [warnings, setWarnings] = useState<{ message: string; suggestion?: string }[]>([])
  const [saved, setSaved] = useState(false)

  // Import modal state
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any>(null)
  const [importSections, setImportSections] = useState<{settings:boolean;steps:boolean;businessHours:boolean;paymentMethods:boolean;notifications:boolean}>({ settings: true, steps: true, businessHours: true, paymentMethods: true, notifications: true })
  const [overwriteExisting, setOverwriteExisting] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/booking-settings', { cache: 'no-store' })
      const data = await res.json()
      setSettings(data)
    } finally { setLoading(false) }
  }

  function onChange(section: string, field: string, value: any) {
    setPending((prev) => ({ ...prev, [section]: { ...(prev as any)[section], [field]: value } }))
  }

  async function onSave() {
    setSaving(true)
    setErrors([])
    setWarnings([])
    try {
      const res = await fetch('/api/admin/booking-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) })
      const data = await res.json()
      if (!res.ok) {
        setErrors(data.errors ?? [{ message: data.error || 'Validation failed' }])
        return
      }
      setSettings(data.settings)
      setWarnings(Array.isArray(data.warnings) ? data.warnings : [])
      setPending({})
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  async function onReset() {
    if (!confirm('Reset all booking settings to defaults?')) return
    setSaving(true)
    try {
      await fetch('/api/admin/booking-settings/reset', { method: 'POST' })
      await load()
      setPending({})
    } finally { setSaving(false) }
  }

  async function onExport() {
    const res = await fetch('/api/admin/booking-settings/export')
    const data = await res.json()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `booking-settings-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function onOpenImport() {
    setImportData(null)
    setImportSections({ settings: true, steps: true, businessHours: true, paymentMethods: true, notifications: true })
    setOverwriteExisting(true)
    setShowImport(true)
  }

  async function onConfirmImport() {
    if (!importData) return
    const sections = Object.entries(importSections).filter(([,v])=>v).map(([k])=>k)
    const payload = { data: importData, overwriteExisting, selectedSections: sections }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/booking-settings/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) {
        setErrors([{ message: data.error || 'Import failed' }])
        return
      }
      setSettings(data.settings)
      setShowImport(false)
      setPending({})
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>)

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center"><SettingsIcon className="w-6 h-6 mr-2"/> Booking Settings</h1>
          <p className="text-gray-600 mt-1">Configure booking policies, payments, steps, and notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGate permission={PERMISSIONS.BOOKING_SETTINGS_EXPORT}>
            <button onClick={onExport} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"><Download className="w-4 h-4 mr-2"/>Export</button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.BOOKING_SETTINGS_IMPORT}>
            <button onClick={onOpenImport} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"><Upload className="w-4 h-4 mr-2"/>Import</button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.BOOKING_SETTINGS_RESET}>
            <button onClick={onReset} disabled={saving} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"><RefreshCw className="w-4 h-4 mr-2"/>Reset</button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.BOOKING_SETTINGS_EDIT}>
            <button onClick={onSave} disabled={saving || Object.keys(pending).length===0} className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"><Save className="w-4 h-4 mr-2"/>{saving? 'Saving...':'Save Changes'}</button>
          </PermissionGate>
        </div>
      </div>

      {saved && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center"><CheckCircle className="w-5 h-5 text-green-600 mr-2"/><span className="text-green-800">Settings saved successfully!</span></div>
      )}
      {errors.length>0 && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center mb-2"><AlertTriangle className="w-5 h-5 text-red-600 mr-2"/><span className="text-red-800 font-medium">Please fix the following errors:</span></div>
          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">{errors.map((e,i)=>(<li key={i}>{e.message}</li>))}</ul>
        </div>
      )}
      {warnings.length>0 && (
        <div className="mx-6 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center mb-2"><AlertTriangle className="w-5 h-5 text-yellow-600 mr-2"/><span className="text-yellow-800 font-medium">Warnings</span></div>
          <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">{warnings.map((w,i)=>(<li key={i}>{w.message}{w.suggestion? ` — ${w.suggestion}`:''}</li>))}</ul>
        </div>
      )}

      <div className="flex">
        <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 space-y-2">
          {[
            { id:'general', label:'General', icon: SettingsIcon },
            { id:'payments', label:'Payments', icon: CreditCard },
            { id:'steps', label:'Booking Steps', icon: Clock },
            { id:'availability', label:'Availability', icon: Calendar },
            { id:'notifications', label:'Notifications', icon: Bell },
            { id:'customers', label:'Customer Experience', icon: Users },
            { id:'assignments', label:'Team Assignments', icon: Shield },
            { id:'pricing', label:'Dynamic Pricing', icon: Zap },
            { id:'automation', label:'Automation', icon: Zap },
            { id:'integrations', label:'Integrations', icon: Plug },
            { id:'capacity', label:'Capacity', icon: Gauge },
            { id:'forms', label:'Forms', icon: ListChecks },
          ].map((t)=>{
            const Icon = t.icon
            const changed = !!(pending as any)[sectionMap(t.id)]
            return (
              <button key={t.id} onClick={()=>setActive(t.id as any)} className={`w-full flex items-center px-3 py-2 text-left rounded-md ${active===t.id? 'bg-blue-100 text-blue-700':'text-gray-700 hover:bg-gray-100'}`}>
                <Icon className="w-5 h-5 mr-3"/>{t.label}
                {changed && <span className="ml-auto w-2 h-2 bg-orange-400 rounded-full"/>}
              </button>
            )
          })}
        </aside>
        <main className="flex-1 p-6">
          {active==='general' && <General settings={settings} onChange={(k,v)=>onChange('generalSettings', k, v)} pending={pending.generalSettings||{}}/>}
          {active==='payments' && <Payments settings={settings} onChange={(k,v)=>onChange('paymentSettings', k, v)} pending={pending.paymentSettings||{}}/>}
          {active==='steps' && <Steps settings={settings} onChange={(k,v)=>onChange('stepSettings', k, v)} pending={pending.stepSettings||{}}/>}
          {active==='availability' && <Availability settings={settings} onChange={(k,v)=>onChange('availabilitySettings', k, v)} pending={pending.availabilitySettings||{}}/>}
          {active==='notifications' && <Notifications settings={settings} onChange={(k,v)=>onChange('notificationSettings', k, v)} pending={pending.notificationSettings||{}}/>}
          {active==='customers' && <Customers settings={settings} onChange={(k,v)=>onChange('customerSettings', k, v)} pending={pending.customerSettings||{}}/>}
          {active==='assignments' && <Assignments settings={settings} onChange={(k,v)=>onChange('assignmentSettings', k, v)} pending={pending.assignmentSettings||{}}/>}
          {active==='pricing' && <Pricing settings={settings} onChange={(k,v)=>onChange('pricingSettings', k, v)} pending={pending.pricingSettings||{}}/>}
          {active==='automation' && <Automation settings={settings} onChange={(k,v)=>onChange('automation', k, v)} pending={pending.automation||{}}/>}
          {active==='integrations' && <Integrations settings={settings} onChange={(k,v)=>onChange('integrations', k, v)} pending={pending.integrations||{}}/>}
          {active==='capacity' && <Capacity settings={settings} onChange={(k,v)=>onChange('capacity', k, v)} pending={pending.capacity||{}}/>}
          {active==='forms' && <Forms settings={settings} onChange={(k,v)=>onChange('forms', k, v)} pending={pending.forms||{}}/>}
        </main>
      </div>

      {showImport && (
        <PermissionGate permission={PERMISSIONS.BOOKING_SETTINGS_IMPORT}>
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Booking Settings</h3>
            <p className="text-gray-600 mb-4">Upload a previously exported settings JSON and choose which sections to import.</p>
            <div className="space-y-4">
              <div>
                <input type="file" accept="application/json" onChange={async (e)=>{
                  const file = e.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  try { setImportData(JSON.parse(text)) } catch { setImportData(null); setErrors([{ message: 'Invalid JSON file' }]) }
                }} className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={importSections.settings} onChange={(e)=>setImportSections(s=>({ ...s, settings: e.target.checked }))}/>Settings (core)</label>
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={importSections.steps} onChange={(e)=>setImportSections(s=>({ ...s, steps: e.target.checked }))}/>Steps</label>
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={importSections.businessHours} onChange={(e)=>setImportSections(s=>({ ...s, businessHours: e.target.checked }))}/>Business Hours</label>
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={importSections.paymentMethods} onChange={(e)=>setImportSections(s=>({ ...s, paymentMethods: e.target.checked }))}/>Payment Methods</label>
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={importSections.notifications} onChange={(e)=>setImportSections(s=>({ ...s, notifications: e.target.checked }))}/>Notifications</label>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={overwriteExisting} onChange={(e)=>setOverwriteExisting(e.target.checked)}/>Overwrite existing</label>
                <div className="space-x-2">
                  <button onClick={()=>setShowImport(false)} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                  <button onClick={onConfirmImport} disabled={!importData || saving} className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">Import</button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </PermissionGate>
      )}
    </div>
  )
}

function sectionMap(id: string){
  switch (id){
    case 'general': return 'generalSettings'
    case 'payments': return 'paymentSettings'
    case 'steps': return 'stepSettings'
    case 'availability': return 'availabilitySettings'
    case 'notifications': return 'notificationSettings'
    case 'customers': return 'customerSettings'
    case 'assignments': return 'assignmentSettings'
    case 'pricing': return 'pricingSettings'
    case 'automation': return 'automation'
    case 'integrations': return 'integrations'
    case 'capacity': return 'capacity'
    case 'forms': return 'forms'
    default: return id
  }
}

function Card({ title, description, children }:{ title:string; description:string; children:React.ReactNode }){
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {children}
    </div>
  )
}

function Toggle({ label, value, onChange, disabled=false }:{ label:string; value:boolean; onChange:(v:boolean)=>void; disabled?:boolean }){
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${disabled?'text-gray-400':'text-gray-700'}`}>{label}</span>
      <button onClick={()=>!disabled&&onChange(!value)} disabled={disabled} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value&&!disabled? 'bg-blue-600':'bg-gray-200'} ${disabled?'opacity-50 cursor-not-allowed':'cursor-pointer'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value? 'translate-x-6':'translate-x-1'}`}/>
      </button>
    </div>
  )
}

function NumberInput({ label, value, onChange, min, max, disabled=false }:{ label:string; value:number; onChange:(v:number)=>void; min?:number; max?:number; disabled?:boolean }){
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="number" value={value} onChange={(e)=>onChange(parseFloat(e.target.value))} min={min} max={max} disabled={disabled} className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${disabled?'bg-gray-100 cursor-not-allowed':''}`}/>
    </div>
  )
}

// ---- Sections ----
function General({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">General</h2><p className="text-gray-600 mb-6">Core booking policies</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Booking Status" description="Enable or disable the booking system">
          <Toggle label="Enable Booking System" value={pending.bookingEnabled ?? settings?.bookingEnabled ?? true} onChange={(v)=>onChange('bookingEnabled', v)}/>
        </Card>
        <Card title="Approval" description="Require manual approval for bookings">
          <Toggle label="Require Approval" value={pending.requireApproval ?? settings?.requireApproval ?? false} onChange={(v)=>onChange('requireApproval', v)}/>
        </Card>
        <Card title="Cancellation" description="Allow customer cancellations">
          <div className="space-y-3">
            <Toggle label="Allow Cancellation" value={pending.allowCancellation ?? settings?.allowCancellation ?? true} onChange={(v)=>onChange('allowCancellation', v)}/>
            <NumberInput label="Deadline (hours)" value={pending.cancellationDeadlineHours ?? settings?.cancellationDeadlineHours ?? 24} onChange={(v)=>onChange('cancellationDeadlineHours', v)} min={1} max={168} disabled={!(pending.allowCancellation ?? settings?.allowCancellation ?? true)}/>
          </div>
        </Card>
        <Card title="Rescheduling" description="Allow customer rescheduling">
          <div className="space-y-3">
            <Toggle label="Allow Rescheduling" value={pending.allowRescheduling ?? settings?.allowRescheduling ?? true} onChange={(v)=>onChange('allowRescheduling', v)}/>
            <NumberInput label="Deadline (hours)" value={pending.rescheduleDeadlineHours ?? settings?.rescheduleDeadlineHours ?? 4} onChange={(v)=>onChange('rescheduleDeadlineHours', v)} min={1} max={72} disabled={!(pending.allowRescheduling ?? settings?.allowRescheduling ?? true)}/>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Payments({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Payments</h2><p className="text-gray-600 mb-6">Configure payment policies</p></div>
      <Card title="Requirements" description="Payment requirement and deposit">
        <div className="space-y-3">
          <Toggle label="Require Payment" value={pending.paymentRequired ?? settings?.paymentRequired ?? false} onChange={(v)=>onChange('paymentRequired', v)}/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Toggle label="Require Full Payment" value={pending.requireFullPayment ?? settings?.requireFullPayment ?? false} onChange={(v)=>onChange('requireFullPayment', v)} disabled={!(pending.paymentRequired ?? settings?.paymentRequired ?? false)}/>
            <Toggle label="Allow Partial Payment" value={pending.allowPartialPayment ?? settings?.allowPartialPayment ?? true} onChange={(v)=>onChange('allowPartialPayment', v)} disabled={!(pending.paymentRequired ?? settings?.paymentRequired ?? false)}/>
          </div>
          <NumberInput label="Deposit (%)" value={pending.depositPercentage ?? settings?.depositPercentage ?? 50} onChange={(v)=>onChange('depositPercentage', v)} min={10} max={100} disabled={!(pending.allowPartialPayment ?? settings?.allowPartialPayment ?? true)}/>
        </div>
      </Card>
      <Card title="Methods" description="Enable or disable payment methods">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            ['acceptCash','Cash'],
            ['acceptCard','Card'],
            ['acceptBankTransfer','Bank Transfer'],
            ['acceptWire','Wire Transfer'],
            ['acceptCrypto','Crypto'],
          ].map(([key,label])=> (
            <button key={key} onClick={()=>{ const current = (((pending as any)[key] ?? settings?.[key as any]) ?? false) as boolean; onChange(key as string, !current) }} className={`border rounded-lg p-3 text-left ${((pending as any)[key] ?? settings?.[key as any])? 'border-blue-500 bg-blue-50':'border-gray-200 bg-gray-50'}`}>
              <div className="text-sm font-medium text-gray-900">{label}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Steps({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  const steps = [
    ['enableServiceSelection','Service Selection','Choose service type', true],
    ['enableDateTimeSelection','Date & Time Selection','Pick slot', true],
    ['enableCustomerDetails','Customer Details','Contact info', true],
    ['enableAdditionalServices','Additional Services','Add-ons', false],
    ['enablePaymentStep','Payment Step','Process payment', false],
    ['enableFileUpload','File Upload','Upload docs', false],
    ['enableSpecialRequests','Special Requests','Additional requirements', false],
    ['enableConfirmationStep','Confirmation','Review and confirm', true],
  ] as const
  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Steps</h2><p className="text-gray-600 mb-6">Enable or disable steps in the booking wizard</p></div>
      {steps.map(([key,label,desc,required],i)=> (
        <div key={key} className={`border rounded-lg p-4 ${((pending as any)[key] ?? settings?.[key as any] ?? true)? 'border-blue-200 bg-blue-50':'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${((pending as any)[key] ?? settings?.[key as any] ?? true)? 'bg-blue-600 text-white':'bg-gray-300 text-gray-600'}`}>{i+1}</div>
              <div>
                <h4 className="font-medium text-gray-900">{label}</h4>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {required && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>}
              <Toggle label="" value={((pending as any)[key] ?? settings?.[key as any] ?? true)} onChange={(v)=>onChange(key, v)} disabled={required}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Availability({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Availability</h2><p className="text-gray-600 mb-6">Set booking timeframes and limits</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Advance Booking" description="How far in advance bookings are allowed">
          <div className="space-y-3">
            <NumberInput label="Maximum Days" value={pending.advanceBookingDays ?? settings?.advanceBookingDays ?? 365} onChange={(v)=>onChange('advanceBookingDays', v)} min={1} max={730}/>
            <NumberInput label="Minimum Hours" value={pending.minAdvanceBookingHours ?? settings?.minAdvanceBookingHours ?? 2} onChange={(v)=>onChange('minAdvanceBookingHours', v)} min={0} max={168}/>
          </div>
        </Card>
        <Card title="Limits" description="Per-day and per-customer caps">
          <div className="space-y-3">
            <NumberInput label="Max Per Day" value={pending.maxBookingsPerDay ?? settings?.maxBookingsPerDay ?? 50} onChange={(v)=>onChange('maxBookingsPerDay', v)} min={1} max={200}/>
            <NumberInput label="Max Per Customer" value={pending.maxBookingsPerCustomer ?? settings?.maxBookingsPerCustomer ?? 5} onChange={(v)=>onChange('maxBookingsPerCustomer', v)} min={1} max={20}/>
          </div>
        </Card>
        <Card title="Buffer" description="Minutes between bookings">
          <NumberInput label="Buffer Minutes" value={pending.bufferTimeBetweenBookings ?? settings?.bufferTimeBetweenBookings ?? 15} onChange={(v)=>onChange('bufferTimeBetweenBookings', v)} min={0} max={120}/>
        </Card>
      </div>
    </div>
  )
}

function Notifications({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2><p className="text-gray-600 mb-6">Configure reminders and channels</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Confirmations" description="Send confirmation notifications">
          <Toggle label="Send Confirmations" value={pending.sendBookingConfirmation ?? settings?.sendBookingConfirmation ?? true} onChange={(v)=>onChange('sendBookingConfirmation', v)}/>
        </Card>
        <Card title="Reminders" description="Send reminder notifications">
          <Toggle label="Send Reminders" value={pending.sendReminders ?? settings?.sendReminders ?? true} onChange={(v)=>onChange('sendReminders', v)}/>
        </Card>
        <Card title="Channels" description="Preferred communication methods">
          <div className="space-y-3">
            <Toggle label="Email" value={pending.emailNotifications ?? settings?.emailNotifications ?? true} onChange={(v)=>onChange('emailNotifications', v)}/>
            <Toggle label="SMS" value={pending.smsNotifications ?? settings?.smsNotifications ?? false} onChange={(v)=>onChange('smsNotifications', v)}/>
          </div>
        </Card>
        <Card title="Team" description="Notify assigned team members">
          <Toggle label="Notify Team Members" value={pending.notifyTeamMembers ?? settings?.notifyTeamMembers ?? true} onChange={(v)=>onChange('notifyTeamMembers', v)}/>
        </Card>
      </div>
    </div>
  )
}

function Customers({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Experience</h2><p className="text-gray-600 mb-6">Authentication, visibility, and options</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Authentication" description="Login requirements">
          <div className="space-y-3">
            <Toggle label="Require Login" value={pending.requireLogin ?? settings?.requireLogin ?? false} onChange={(v)=>onChange('requireLogin', v)}/>
            <Toggle label="Allow Guest Booking" value={pending.allowGuestBooking ?? settings?.allowGuestBooking ?? true} onChange={(v)=>onChange('allowGuestBooking', v)} disabled={pending.requireLogin ?? settings?.requireLogin ?? false}/>
          </div>
        </Card>
        <Card title="Pricing" description="Show pricing information">
          <Toggle label="Show Pricing" value={pending.showPricing ?? settings?.showPricing ?? true} onChange={(v)=>onChange('showPricing', v)}/>
        </Card>
        <Card title="Team Selection" description="Allow customers to choose a team member">
          <Toggle label="Show Team Selection" value={pending.showTeamMemberSelection ?? settings?.showTeamMemberSelection ?? false} onChange={(v)=>onChange('showTeamMemberSelection', v)}/>
        </Card>
        <Card title="Advanced" description="Additional options">
          <div className="space-y-3">
            <Toggle label="Allow Recurring Bookings" value={pending.allowRecurringBookings ?? settings?.allowRecurringBookings ?? false} onChange={(v)=>onChange('allowRecurringBookings', v)}/>
            <Toggle label="Enable Waitlist" value={pending.enableWaitlist ?? settings?.enableWaitlist ?? false} onChange={(v)=>onChange('enableWaitlist', v)}/>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Assignments({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Team Assignments</h2><p className="text-gray-600 mb-6">Auto-assignment strategy</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Auto Assignment" description="Automatically assign team members"><Toggle label="Enable Auto Assignment" value={pending.enableAutoAssignment ?? settings?.enableAutoAssignment ?? false} onChange={(v)=>onChange('enableAutoAssignment', v)}/></Card>
        <Card title="Strategy" description="Selection logic">
          <select value={pending.assignmentStrategy ?? settings?.assignmentStrategy ?? 'ROUND_ROBIN'} onChange={(e)=>onChange('assignmentStrategy', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
            <option value="ROUND_ROBIN">Round Robin</option>
            <option value="LOAD_BALANCED">Load Balanced</option>
            <option value="SKILL_BASED">Skill Based</option>
            <option value="AVAILABILITY_BASED">Availability Based</option>
            <option value="MANUAL">Manual</option>
          </select>
        </Card>
      </div>
    </div>
  )
}

function Pricing({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Dynamic Pricing</h2><p className="text-gray-600 mb-6">Configure surcharges</p></div>
      <Card title="Surcharges" description="Percent multipliers (0-200%)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberInput label="Peak Hours (%)" value={pending.peakHoursSurcharge ?? (settings?.peakHoursSurcharge ?? 0)*100} onChange={(v)=>onChange('peakHoursSurcharge', v/100)} min={0} max={200}/>
          <NumberInput label="Weekend (%)" value={pending.weekendSurcharge ?? (settings?.weekendSurcharge ?? 0)*100} onChange={(v)=>onChange('weekendSurcharge', v/100)} min={0} max={200}/>
          <NumberInput label="Emergency (%)" value={pending.emergencyBookingSurcharge ?? (settings?.emergencyBookingSurcharge ?? 0.5)*100} onChange={(v)=>onChange('emergencyBookingSurcharge', v/100)} min={0} max={200}/>
        </div>
      </Card>
    </div>
  )
}

function Automation({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Automation</h2><p className="text-gray-600 mb-6">Auto-confirm rules and follow-ups</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Auto-confirm" description="Automatically confirm bookings under conditions">
          <div className="space-y-3">
            <Toggle label="Enable Auto-confirm" value={pending.autoConfirm ?? settings?.automation?.autoConfirm ?? false} onChange={(v)=>onChange('autoConfirm', v)}/>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm If</label>
              <select value={pending.confirmIf ?? settings?.automation?.confirmIf ?? 'known-client'} onChange={(e)=>onChange('confirmIf', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="always">Always</option>
                <option value="known-client">Known Client</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </Card>
        <Card title="Cancellation Policy" description="Grace period and fees">
          <div className="space-y-3">
            <NumberInput label="Hours Before" value={pending.cancellationPolicy?.hoursBefore ?? settings?.automation?.cancellationPolicy?.hoursBefore ?? 24} onChange={(v)=>onChange('cancellationPolicy', { ...(pending.cancellationPolicy ?? settings?.automation?.cancellationPolicy ?? {}), hoursBefore: v })} min={0} max={720}/>
            <NumberInput label="Fee (%)" value={pending.cancellationPolicy?.feePercent ?? settings?.automation?.cancellationPolicy?.feePercent ?? 0} onChange={(v)=>onChange('cancellationPolicy', { ...(pending.cancellationPolicy ?? settings?.automation?.cancellationPolicy ?? {}), feePercent: v })} min={0} max={100}/>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Integrations({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Integrations</h2><p className="text-gray-600 mb-6">Calendar and conferencing providers</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Calendar Sync" description="Select calendar provider">
          <select value={pending.calendarSync ?? settings?.integrations?.calendarSync ?? 'none'} onChange={(e)=>onChange('calendarSync', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
            <option value="none">None</option>
            <option value="google">Google Calendar</option>
            <option value="outlook">Outlook</option>
            <option value="ical">iCal</option>
          </select>
        </Card>
        <Card title="Conferencing" description="Meeting link provider">
          <select value={pending.conferencing ?? settings?.integrations?.conferencing ?? 'none'} onChange={(e)=>onChange('conferencing', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
            <option value="none">None</option>
            <option value="zoom">Zoom</option>
            <option value="meet">Google Meet</option>
          </select>
        </Card>
      </div>
    </div>
  )
}

function Capacity({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Capacity</h2><p className="text-gray-600 mb-6">Resource pooling and limits</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Pooling" description="Share resources across services">
          <Toggle label="Enable Pooled Resources" value={pending.pooledResources ?? settings?.capacity?.pooledResources ?? false} onChange={(v)=>onChange('pooledResources', v)}/>
        </Card>
        <Card title="Concurrent Limit" description="Max simultaneous bookings">
          <NumberInput label="Concurrent Limit" value={pending.concurrentLimit ?? settings?.capacity?.concurrentLimit ?? 5} onChange={(v)=>onChange('concurrentLimit', v)} min={1} max={100}/>
        </Card>
        <Card title="Waitlist" description="Allow customers to waitlist">
          <Toggle label="Enable Waitlist" value={pending.waitlist ?? settings?.capacity?.waitlist ?? false} onChange={(v)=>onChange('waitlist', v)}/>
        </Card>
      </div>
    </div>
  )
}

function Forms({ settings, onChange, pending }:{ settings:any; onChange:(k:string,v:any)=>void; pending:any }){
  const fields: any[] = pending.fields ?? settings?.forms?.fields ?? []
  function updateField(idx: number, patch: any){
    const next = [...fields]
    next[idx] = { ...next[idx], ...patch }
    onChange('fields', next)
  }
  function addField(){ onChange('fields', [...fields, { key: '', label: '', type: 'text', required: false }]) }
  function removeField(i: number){ const next = fields.filter((_,idx)=>idx!==i); onChange('fields', next) }

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-semibold text-gray-900 mb-4">Forms</h2><p className="text-gray-600 mb-6">Custom intake fields and validation rules</p></div>
      <Card title="Fields" description="Add and configure intake fields">
        <div className="space-y-4">
          {fields.length===0 && <div className="text-sm text-gray-600">No fields yet.</div>}
          {fields.map((f, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                <input value={f.key} onChange={(e)=>updateField(i, { key: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input value={f.label} onChange={(e)=>updateField(i, { label: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={f.type} onChange={(e)=>updateField(i, { type: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="text">Text</option>
                  <option value="select">Select</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700"><input type="checkbox" checked={!!f.required} onChange={(e)=>updateField(i, { required: e.target.checked })} className="mr-2"/>Required</label>
                <button onClick={()=>removeField(i)} className="ml-auto px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Remove</button>
              </div>
              {f.type==='select' && (
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Options (comma-separated)</label>
                  <input value={(f.options||[]).join(', ')} onChange={(e)=>updateField(i, { options: e.target.value.split(',').map((x:string)=>x.trim()).filter(Boolean) })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                </div>
              )}
            </div>
          ))}
          <button onClick={addField} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">Add Field</button>
        </div>
      </Card>
    </div>
  )
}
