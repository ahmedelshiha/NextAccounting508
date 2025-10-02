'use client'
import React, { useEffect, useState } from 'react'
import { TextField } from '@/components/admin/settings/FormField'
import { getOrgSettings, updateOrgSettings } from '@/services/org-settings.service'

export default function ContactTab(){
  const [pending, setPending] = useState({ contactEmail: '', contactPhone: '', address: { line1: '', line2: '', city: '', region: '', postalCode: '', country: '' } })
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => {
    try {
      const j = await getOrgSettings()
      const c = j?.contact || {}
      setPending({ contactEmail: c.contactEmail ?? '', contactPhone: c.contactPhone ?? '', address: c.address ?? { line1: '', line2: '', city: '', region: '', postalCode: '', country: '' } })
    } catch (e) { console.error(e) }
  })() }, [])

  async function save(){
    setSaving(true)
    try {
      await updateOrgSettings({ contact: pending })
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <TextField label="Support Email" value={pending.contactEmail} onChange={(v)=>setPending(p=>({ ...p, contactEmail:v }))} placeholder="support@example.com" />
      <TextField label="Support Phone" value={pending.contactPhone} onChange={(v)=>setPending(p=>({ ...p, contactPhone:v }))} placeholder="+1 555 0100" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Address Line 1" value={pending.address.line1} onChange={(v)=>setPending(p=>({ ...p, address: { ...p.address, line1: v } }))} />
        <TextField label="Address Line 2" value={pending.address.line2} onChange={(v)=>setPending(p=>({ ...p, address: { ...p.address, line2: v } }))} />
        <TextField label="City" value={pending.address.city} onChange={(v)=>setPending(p=>({ ...p, address: { ...p.address, city: v } }))} />
        <TextField label="Region/State" value={pending.address.region} onChange={(v)=>setPending(p=>({ ...p, address: { ...p.address, region: v } }))} />
        <TextField label="Postal Code" value={pending.address.postalCode} onChange={(v)=>setPending(p=>({ ...p, address: { ...p.address, postalCode: v } }))} />
        <TextField label="Country" value={pending.address.country} onChange={(v)=>setPending(p=>({ ...p, address: { ...p.address, country: v } }))} />
      </div>

      <div className="pt-4">
        <button onClick={save} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50" disabled={saving}>Save Changes</button>
      </div>
    </div>
  )
}
