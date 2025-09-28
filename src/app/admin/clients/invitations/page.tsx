'use client'

import { useState } from 'react'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { apiFetch } from '@/lib/api'

interface SentInvite { email: string; status: 'sent' | 'error'; message?: string }

export default function ClientInvitationsAdminPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<SentInvite[]>([])

  const sendInvite = async () => {
    setError(null)
    const target = email.trim()
    if (!target) {
      setError('Enter an email address')
      return
    }
    setSending(true)
    try {
      const res = await apiFetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'basic', email: target }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to send invitation')
      }
      setSent((prev) => [{ email: target, status: 'sent' }, ...prev])
      setEmail('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send invitation'
      setError(msg)
      setSent((prev) => [{ email: target, status: 'error', message: msg }, ...prev])
    } finally {
      setSending(false)
    }
  }

  return (
    <StandardPage
      title="Client Invitations"
      subtitle="Invite clients to access their portal"
      primaryAction={{ label: 'New Client', onClick: () => (window.location.href = '/admin/clients/new') }}
      error={error}
    >
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={sendInvite} disabled={sending}>
              {sending ? 'Sending…' : 'Send Invitation'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Sends a test invitation email using the configured email provider.</p>
        </CardContent>
      </Card>

      {sent.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b text-sm font-medium">Recent Invitations</div>
          <ul className="divide-y">
            {sent.map((s, idx) => (
              <li key={idx} className="px-4 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{s.email}</span>
                  <Badge variant={s.status === 'sent' ? 'secondary' : 'destructive'}>
                    {s.status === 'sent' ? 'Sent' : 'Error'}
                  </Badge>
                </div>
                {s.message && <span className="text-gray-500">{s.message}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </StandardPage>
  )
}
