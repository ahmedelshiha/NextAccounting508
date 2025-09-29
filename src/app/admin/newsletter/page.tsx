"use client"
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import ListPage from '@/components/dashboard/templates/ListPage'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import type { Column, RowAction } from '@/types/dashboard'

interface Subscription { id: string; email: string; name?: string | null; subscribed: boolean; createdAt: string }

export default function AdminNewsletterPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/newsletter')
      if (res.ok) {
        const data = await res.json()
        setSubs(data.subscriptions || [])
      } else {
        setSubs([])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const unsubscribe = async (email: string) => {
    const res = await apiFetch('/api/newsletter/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    if (res.ok) load()
  }

  const columns: Column<Subscription>[] = useMemo(() => ([
    { key: 'email', label: 'Email', sortable: true },
    { key: 'name', label: 'Name', sortable: true, render: (v) => v ? String(v) : '' },
    { key: 'subscribed', label: 'Status', sortable: true, render: (v: boolean) => (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{v ? 'Active' : 'Inactive'}</span>
    ) },
    { key: 'createdAt', label: 'Subscribed At', sortable: true, render: (v: string) => new Date(v).toLocaleString() },
  ]), [])

  const actions: RowAction<Subscription>[] = [
    { label: 'Unsubscribe', onClick: (row) => { if (row.subscribed) void unsubscribe(row.email) }, disabled: (row) => !row.subscribed }
  ]

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Newsletter.</div>}>
      <ListPage<Subscription>
        title="Newsletter"
        subtitle="Manage newsletter subscribers"
        secondaryActions={[{ label: 'Export CSV', onClick: () => { window.location.href = '/api/admin/export?entity=newsletter' } }]}
        columns={columns}
        rows={subs}
        loading={loading}
        useAdvancedTable
        emptyMessage="No subscribers yet."
        actions={actions}
        selectable={false}
      />
    </PermissionGate>
  )
}
