import { useEffect, useState } from 'react'
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function QuarantinePage() {
  const [items, setItems] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/uploads/quarantine')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setItems(json.data || [])
    } catch (e) {
      setItems([])
      toast.error('Failed to load quarantine')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const doAction = async (action: 'release' | 'delete', key: string) => {
    if (!confirm(`Are you sure you want to ${action} ${key}?`)) return
    try {
      const res = await fetch('/api/admin/uploads/quarantine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, key }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || 'Action failed')
        return
      }
      toast.success('Action succeeded')
      fetchItems()
    } catch (e) {
      toast.error('Action failed')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quarantined Uploads</h1>
        <Button onClick={fetchItems}>Refresh</Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : items === null ? (
        <div>No data</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">No quarantined uploads.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((it: any) => (
            <Card key={it.key}>
              <CardHeader>
                <CardTitle className="text-sm truncate">{it.key}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Size: {it.size || '—'}</div>
                    <div className="text-sm text-gray-600">Created: {it.createdAt || '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="destructive" onClick={() => doAction('delete', it.key)}>Delete</Button>
                    <Button onClick={() => doAction('release', it.key)}>Release</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
