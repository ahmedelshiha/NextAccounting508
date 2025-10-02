'use client'
import React, { useEffect, useState } from 'react'
import { TextField } from '@/components/admin/settings/FormField'
import { getOrgSettings, updateOrgSettings } from '@/services/org-settings.service'

type LegalLinks = { terms: string; privacy: string; refund: string }

type BrandingState = {
  logoUrl: string
  branding: Record<string, any>
  legalLinks: LegalLinks
}

export default function BrandingTab(){
  const [pending, setPending] = useState<BrandingState>({ logoUrl: '', branding: {}, legalLinks: { terms: '', privacy: '', refund: '' } })
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => {
    try {
      const j = await getOrgSettings()
      const b = (j?.branding || {}) as Partial<{ logoUrl: string; branding: Record<string, any>; legalLinks: Record<string, string> }>
      const ll = (b.legalLinks || {}) as Record<string, string>
      setPending({
        logoUrl: b.logoUrl ?? '',
        branding: b.branding ?? {},
        legalLinks: {
          terms: ll.terms ?? '',
          privacy: ll.privacy ?? '',
          refund: ll.refund ?? ''
        }
      })
    } catch (e) { console.error(e) }
  })() }, [])

  async function save(){
    setSaving(true)
    try {
      await updateOrgSettings({ branding: { logoUrl: pending.logoUrl, branding: pending.branding, legalLinks: pending.legalLinks } })
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <TextField label="Logo URL" value={pending.logoUrl} onChange={(v)=>setPending(p=>({ ...p, logoUrl: v }))} placeholder="https://.../logo.png" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Terms of Service URL" value={pending.legalLinks.terms} onChange={(v)=>setPending(p=>({ ...p, legalLinks: { ...p.legalLinks, terms: v } }))} />
        <TextField label="Privacy Policy URL" value={pending.legalLinks.privacy} onChange={(v)=>setPending(p=>({ ...p, legalLinks: { ...p.legalLinks, privacy: v } }))} />
        <TextField label="Refund Policy URL" value={pending.legalLinks.refund} onChange={(v)=>setPending(p=>({ ...p, legalLinks: { ...p.legalLinks, refund: v } }))} />
      </div>

      <div className="pt-4">
        <button onClick={save} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50" disabled={saving}>Save Changes</button>
      </div>
    </div>
  )
}
