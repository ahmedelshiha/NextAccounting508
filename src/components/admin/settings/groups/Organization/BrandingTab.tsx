import React, { useEffect, useState } from 'react'
import { TextField } from '@/components/admin/settings/FormField'
import { getOrgSettings, updateOrgSettings } from '@/services/org-settings.service'
import { toast } from 'sonner'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useOrgSettings } from '@/components/providers/SettingsProvider'

type BrandingState = {
  logoUrl: string
  branding: Record<string, any>
}

export default function BrandingTab(){
  const [pending, setPending] = useState<BrandingState>({ logoUrl: '', branding: {} })
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const ctx = useOrgSettings()
  const orgName = ctx?.settings?.name || 'Accounting Firm'
  const initials = (orgName || 'A').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()

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
      setOpen(false)
    } catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : 'Failed to save branding settings'
      toast.error(msg)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
            {pending.logoUrl ? (
               
              <img src={pending.logoUrl} alt={`${orgName} logo`} className="h-10 w-10 object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">{initials}</span>
            )}
          </div>
          <div>
            <div className="text-sm font-medium">{orgName}</div>
            <div className="text-xs text-gray-500 truncate max-w-[240px]">{pending.logoUrl || 'No logo URL set'}</div>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="default">Edit Branding</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Branding</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <TextField label="Logo URL" value={pending.logoUrl} onChange={(v)=>setPending(p=>({ ...p, logoUrl: v }))} placeholder="https://.../logo.png" />
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
