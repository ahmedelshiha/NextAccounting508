'use client'
import React, { useEffect, useState } from 'react'
import { TextField } from '@/components/admin/settings/FormField'
import { getOrgSettings, updateOrgSettings } from '@/services/org-settings.service'
import { toast } from 'sonner'

type BrandingState = {
  logoUrl: string
  branding: Record<string, any>
}

export default function BrandingTab(){
  const [pending, setPending] = useState<BrandingState>({ logoUrl: '', branding: {} })
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => {
    try {
      const j = await getOrgSettings()
      const b = (j?.branding || {}) as Partial<{ logoUrl: string; branding: Record<string, any> }>
      setPending({
        logoUrl: b.logoUrl ?? '',
        branding: b.branding ?? {}
      })
    } catch (e) { console.error(e) }
  })() }, [])

  async function save(){
    setSaving(true)
    try {
      await updateOrgSettings({ branding: { logoUrl: pending.logoUrl, branding: pending.branding } })
      toast.success('Branding settings saved')
    } catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : 'Failed to save branding settings'
      toast.error(msg)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <TextField label="Logo URL" value={pending.logoUrl} onChange={(v)=>setPending(p=>({ ...p, logoUrl: v }))} placeholder="https://.../logo.png" />


      <div className="pt-4">
        <button onClick={save} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50" disabled={saving}>Save Changes</button>
      </div>
    </div>
  )
}
