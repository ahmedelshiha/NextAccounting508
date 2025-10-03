import React, { useEffect, useState } from 'react'
import { TextField } from '@/components/admin/settings/FormField'
import { getOrgSettings, updateOrgSettings } from '@/services/org-settings.service'
import { toast } from 'sonner'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function ContactTab(){
  const [pending, setPending] = useState({ contactEmail: '', contactPhone: '', address: { line1: '', line2: '', city: '', region: '', postalCode: '', country: '' } })
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => { (async () => {
    try {
      const j = await getOrgSettings()
      const c = (j?.contact || {}) as Partial<{ contactEmail: string; contactPhone: string; address: Partial<{ line1: string; line2: string; city: string; region: string; postalCode: string; country: string }> }>
      const addr = c.address || {}
      setPending({
        contactEmail: c.contactEmail ?? '',
        contactPhone: c.contactPhone ?? '',
        address: {
          line1: addr.line1 ?? '',
          line2: addr.line2 ?? '',
          city: addr.city ?? '',
          region: addr.region ?? '',
          postalCode: addr.postalCode ?? '',
          country: addr.country ?? ''
        }
      })
    } catch (e) { console.error(e) }
  })() }, [])

  async function save(){
    setSaving(true)
    try {
      await updateOrgSettings({ contact: pending })
      toast.success('Contact settings saved')
      setOpen(false)
    } catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : 'Failed to save contact settings'
      toast.error(msg)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4 bg-white flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Primary contact</div>
          <div className="mt-1 text-xs text-gray-500">{pending.contactEmail || '—'} • {pending.contactPhone || '—'}</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="default">Edit Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
            </DialogHeader>
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
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
