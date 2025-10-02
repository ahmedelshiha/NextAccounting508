'use client'
import React, { useEffect, useState } from 'react'
import { SelectField, TextField } from '@/components/admin/settings/FormField'
import { getOrgSettings, updateOrgSettings } from '@/services/org-settings.service'

type LocalizationState = { defaultTimezone: string; defaultCurrency: string; defaultLocale: string }

export default function LocalizationTab(){
  const [pending, setPending] = useState<LocalizationState>({ defaultTimezone: 'UTC', defaultCurrency: 'USD', defaultLocale: 'en' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => {
    try {
      const j = await getOrgSettings()
      const loc = (j?.localization || {}) as Partial<LocalizationState>
      setPending({ defaultTimezone: loc.defaultTimezone ?? 'UTC', defaultCurrency: loc.defaultCurrency ?? 'USD', defaultLocale: loc.defaultLocale ?? 'en' })
    } catch (e) { console.error(e) }
  })() }, [])

  async function save(){
    setSaving(true)
    try {
      await updateOrgSettings({ localization: pending })
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <SelectField label="Default Timezone" value={pending.defaultTimezone} onChange={(v)=>setPending(p=>({ ...p, defaultTimezone: v }))} options={[{value:'UTC',label:'UTC'},{value:'America/New_York',label:'America/New_York'},{value:'Europe/London',label:'Europe/London'}]} />
      <TextField label="Default Currency" value={pending.defaultCurrency} onChange={(v)=>setPending(p=>({ ...p, defaultCurrency: v }))} placeholder="USD" />
      <SelectField label="Default Language" value={pending.defaultLocale} onChange={(v)=>setPending(p=>({ ...p, defaultLocale: v }))} options={[{value:'en',label:'English'},{value:'hi',label:'Hindi'},{value:'ar',label:'Arabic'}]} />

      <div className="pt-4">
        <button onClick={save} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50" disabled={saving}>Save Changes</button>
      </div>
    </div>
  )
}
