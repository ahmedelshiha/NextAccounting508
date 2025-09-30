'use client'

import React, { useEffect, useState } from 'react'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export default function FinancialSettingsPage() {
  const [active, setActive] = useState('invoicing')
  const [settings, setSettings] = useState<any>({})
  const [pending, setPending] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load(){
    setLoading(true)
    try {
      const res = await fetch('/api/admin/financial-settings', { cache: 'no-store' })
      const data = await res.json()
      setSettings(data.settings || {})
    } finally { setLoading(false) }
  }

  function onChange(section: string, field: string, value: any){
    setPending((prev: any) => ({ ...prev, [section]: { ...(prev[section]||{}), [field]: value } }))
  }

  async function onSave(){
    setSaving(true)
    try {
      const res = await fetch('/api/admin/financial-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) })
      if (res.ok) { const data = await res.json(); setSettings(data.settings); setPending({}) }
    } finally { setSaving(false) }
  }

  const tabs = [
    { key: 'invoicing', label: 'Invoicing' },
    { key: 'payments', label: 'Payments' },
    { key: 'taxes', label: 'Taxes' },
    { key: 'currencies', label: 'Currencies' },
    { key: 'reconciliation', label: 'Reconciliation' },
  ]

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <PermissionGate permission={PERMISSIONS.FINANCIAL_SETTINGS_EDIT}>
          <button onClick={onSave} disabled={saving || Object.keys(pending).length===0} className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">{saving? 'Saving...':'Save Changes'}</button>
        </PermissionGate>
      </div>
      <SettingsShell
        title="Financial Settings"
        description="Configure invoicing, payments, taxes, currencies, and reconciliation"
        tabs={tabs}
        activeTab={active}
        onChangeTab={setActive}
      >
        {active==='invoicing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Invoice Prefix" value={pending.invoicing?.invoicePrefix ?? settings?.invoicing?.invoicePrefix ?? 'INV'} onChange={(v)=>onChange('invoicing','invoicePrefix',v)} />
            <Field label="Next Number" type="number" value={pending.invoicing?.nextNumber ?? settings?.invoicing?.nextNumber ?? 1} onChange={(v)=>onChange('invoicing','nextNumber', Number(v))} />
            <Field label="Default Due Days" type="number" value={pending.invoicing?.dueDaysDefault ?? settings?.invoicing?.dueDaysDefault ?? 30} onChange={(v)=>onChange('invoicing','dueDaysDefault', Number(v))} />
            <Toggle label="Auto-numbering" checked={pending.invoicing?.autoNumbering ?? settings?.invoicing?.autoNumbering ?? true} onChange={(v)=>onChange('invoicing','autoNumbering', v)} />
            <Toggle label="Send Invoice Email" checked={pending.invoicing?.sendInvoiceEmail ?? settings?.invoicing?.sendInvoiceEmail ?? true} onChange={(v)=>onChange('invoicing','sendInvoiceEmail', v)} />
          </div>
        )}

        {active==='payments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Currency" value={pending.payments?.currency ?? settings?.payments?.currency ?? 'USD'} onChange={(v)=>onChange('payments','currency',v)} />
            <Select label="Provider" value={pending.payments?.paymentProvider ?? settings?.payments?.paymentProvider ?? 'none'} onChange={(v)=>onChange('payments','paymentProvider',v)} options={[['none','None'],['stripe','Stripe'],['paypal','PayPal']]} />
            <Select label="Capture Mode" value={pending.payments?.captureMode ?? settings?.payments?.captureMode ?? 'authorize_capture'} onChange={(v)=>onChange('payments','captureMode',v)} options={[["authorize_capture","Authorize + Capture"],["authorize_only","Authorize Only"]]} />
            <Toggle label="Allow COD" checked={pending.payments?.allowCOD ?? settings?.payments?.allowCOD ?? false} onChange={(v)=>onChange('payments','allowCOD', v)} />
            <Toggle label="Allow Bank Transfer" checked={pending.payments?.allowBankTransfer ?? settings?.payments?.allowBankTransfer ?? true} onChange={(v)=>onChange('payments','allowBankTransfer', v)} />
            <Toggle label="Allow Card" checked={pending.payments?.allowCard ?? settings?.payments?.allowCard ?? true} onChange={(v)=>onChange('payments','allowCard', v)} />
          </div>
        )}

        {active==='taxes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Toggle label="Tax Inclusive" checked={pending.taxes?.taxInclusive ?? settings?.taxes?.taxInclusive ?? false} onChange={(v)=>onChange('taxes','taxInclusive', v)} />
            <Field label="Default Rate (0-1)" type="number" value={pending.taxes?.defaultRate ?? settings?.taxes?.defaultRate ?? 0} onChange={(v)=>onChange('taxes','defaultRate', Number(v))} />
          </div>
        )}

        {active==='currencies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Base" value={pending.currencies?.base ?? settings?.currencies?.base ?? 'USD'} onChange={(v)=>onChange('currencies','base', v)} />
            <Field label="Enabled (comma)" value={(pending.currencies?.enabled ?? settings?.currencies?.enabled ?? ['USD']).join(', ')} onChange={(v)=>onChange('currencies','enabled', String(v).split(',').map((x: string)=>x.trim()).filter(Boolean))} />
          </div>
        )}

        {active==='reconciliation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Auto-match Threshold (¢)" type="number" value={pending.reconciliation?.autoMatchThresholdCents ?? settings?.reconciliation?.autoMatchThresholdCents ?? 200} onChange={(v)=>onChange('reconciliation','autoMatchThresholdCents', Number(v))} />
            <Field label="Lock Period Days" type="number" value={pending.reconciliation?.lockPeriodDays ?? settings?.reconciliation?.lockPeriodDays ?? 0} onChange={(v)=>onChange('reconciliation','lockPeriodDays', Number(v))} />
            <Toggle label="Require Two-person Approval" checked={pending.reconciliation?.requireTwoPersonApproval ?? settings?.reconciliation?.requireTwoPersonApproval ?? false} onChange={(v)=>onChange('reconciliation','requireTwoPersonApproval', v)} />
          </div>
        )}
      </SettingsShell>
    </div>
  )
}

function Field({ label, value, onChange, type='text' }: { label: string; value: any; onChange: (v: any)=>void; type?: string }){
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e)=>onChange((type==='number'? Number(e.target.value): e.target.value))} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
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

function Select({ label, value, onChange, options }:{ label:string; value:string; onChange:(v:string)=>void; options:[string,string][] }){
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={(e)=>onChange(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
        {options.map(([v,l])=> (<option key={v} value={v}>{l}</option>))}
      </select>
    </div>
  )
}
