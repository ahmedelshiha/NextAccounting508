"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { apiFetch } from '@/lib/api'
import { Loader2, Trash2, ShieldCheck } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'

interface Props {
  selectedIds: string[]
  onDone: () => void
}

export default function ServiceRequestsBulkActions({ selectedIds, onDone }: Props) {
  const [status, setStatus] = useState<'DRAFT'|'SUBMITTED'|'IN_REVIEW'|'APPROVED'|'ASSIGNED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED' | ''>('')
  const [working, setWorking] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const perms = usePermissions()

  const updateStatus = async () => {
    if (!status || selectedIds.length === 0) return
    setWorking(true)
    try {
      const res = await apiFetch('/api/admin/service-requests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', ids: selectedIds, status })
      })
      if (!res.ok) throw new Error('Bulk status failed')
    } finally {
      setWorking(false)
      onDone()
    }
  }

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return
    setWorking(true)
    try {
      const res = await apiFetch('/api/admin/service-requests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: selectedIds })
      })
      if (!res.ok) throw new Error('Bulk delete failed')
    } finally {
      setWorking(false)
      setConfirmOpen(false)
      onDone()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Set status for selected" />
          </SelectTrigger>
          <SelectContent>
            {['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s => (
              <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={updateStatus} disabled={!status || selectedIds.length === 0 || working || !perms.has(PERMISSIONS.SERVICE_REQUESTS_UPDATE)} className="flex items-center gap-2">
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Apply
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={selectedIds.length === 0 || working || !perms.has(PERMISSIONS.SERVICE_REQUESTS_DELETE)} className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected requests?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete {selectedIds.length} selected request(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelected} className="bg-red-600 hover:bg-red-700">
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
