'use client'
import React, { useEffect, useState } from 'react'
import { TextField } from '@/components/admin/settings/FormField'

export default function LegalTab(){
  const [pending, setPending] = useState({ termsUrl: '', privacyUrl: '', refundUrl: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => {
    try {
      const r = await fetch('/api/admin/org-settings')
      if (r.ok) {
        const j = await r.json()
        const links = j?.branding?.legalLinks || {}
        setPending({ termsUrl: links.terms ?? '', privacyUrl: links.privacy ?? '', refundUrl: links.refund ?? '' })
      }
    } catch (e) { console.error(e) }
  })() }, [])

  async function save(){
    setSaving(true)
    try {
      const body = { branding: { legalLinks: { terms: pending.termsUrl, privacy: pending.privacyUrl, refund: pending.refundUrl } } }
      const r = await fetch('/api/admin/org-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) console.error('Failed to save legal links')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <TextField label="Terms of Service URL" value={pending.termsUrl} onChange={(v)=>setPending(p=>({ ...p, termsUrl: v }))} />
      <TextField label="Privacy Policy URL" value={pending.privacyUrl} onChange={(v)=>setPending(p=>({ ...p, privacyUrl: v }))} />
      <TextField label="Refund Policy URL" value={pending.refundUrl} onChange={(v)=>setPending(p=>({ ...p, refundUrl: v }))} />

      <div className="pt-4">
        <button onClick={save} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50" disabled={saving}>Save Changes</button>
      </div>
    </div>
  )
}
