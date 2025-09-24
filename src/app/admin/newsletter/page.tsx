"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StandardPage from '@/components/dashboard/templates/StandardPage'

interface Subscription { id: string; email: string; name?: string | null; subscribed: boolean; createdAt: string }

export default function AdminNewsletterPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await apiFetch('/api/newsletter')
      if (res.ok) {
        const data = await res.json()
        setSubs(data.subscriptions || [])
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

  return (
    <StandardPage title="Newsletter" subtitle="Manage newsletter subscribers" secondaryActions={[{ label: 'Export CSV', onClick: () => { window.location.href = '/api/admin/export?entity=newsletter' } }]}>
      <Card>
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>All newsletter signups</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (<div key={i} className="bg-gray-200 rounded-lg h-16" />))}
            </div>
          ) : subs.length ? (
            <div className="divide-y divide-gray-100">
              {subs.map(s => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-gray-900">{s.email}</div>
                    {s.name && <div className="text-sm text-gray-600">{s.name}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {s.subscribed ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                    )}
                    {s.subscribed && (
                      <Button size="sm" variant="outline" onClick={() => unsubscribe(s.email)}>Unsubscribe</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No subscribers yet.</div>
          )}
        </CardContent>
      </Card>
    </StandardPage>
  )
}
