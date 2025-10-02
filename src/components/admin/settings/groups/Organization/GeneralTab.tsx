'use client'
import React, { useEffect, useState } from 'react'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import { TextField } from '@/components/admin/settings/FormField'
import { getOrgSettings, updateOrgSettings } from '@/services/org-settings.service'
import { toast } from 'sonner'

export default function OrgGeneralTab(){
  const [pending, setPending] = useState({ name: '', tagline: '', description: '', industry: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => {
    try {
      const j = await getOrgSettings()
      setPending({ name: j?.general?.name ?? '', tagline: j?.general?.tagline ?? '', description: j?.general?.description ?? '', industry: j?.general?.industry ?? '' })
    } catch (e) { console.error(e) }
  })() }, [])

  async function save(){
    setSaving(true)
    try {
      await updateOrgSettings({ general: pending })
      toast.success('Organization settings saved')
    } catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : 'Failed to save organization settings'
      toast.error(msg)
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="space-y-4">
        <TextField label="Company Name" value={pending.name} onChange={(v)=>setPending(p=>({ ...p, name:v }))} />
        <TextField label="Tagline" value={pending.tagline} onChange={(v)=>setPending(p=>({ ...p, tagline:v }))} />
        <TextField label="Description" value={pending.description} onChange={(v)=>setPending(p=>({ ...p, description:v }))} />
        <TextField label="Industry" value={pending.industry} onChange={(v)=>setPending(p=>({ ...p, industry:v }))} />
        <div className="pt-4">
          <button onClick={save} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50" disabled={saving}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}
