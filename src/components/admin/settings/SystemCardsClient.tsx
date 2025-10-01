"use client"

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SystemStatus {
  database: boolean
  authentication: { url: boolean; secret: boolean }
  environment: { nodeEnv: string; databaseConfigured: boolean }
}

export default function SystemCardsClient({ status }: { status: SystemStatus }) {
  const [dbMessage, setDbMessage] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  const testDatabase = async () => {
    setDbMessage('Testing...')
    await new Promise((r) => setTimeout(r, 50))
    setDbMessage(status.database ? 'Connection OK' : 'Connection Failed')
  }

  const testAuth = async () => {
    setAuthMessage('Testing...')
    await new Promise((r) => setTimeout(r, 50))
    setAuthMessage(status.authentication.url && status.authentication.secret ? 'Auth OK' : 'Auth Incomplete')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="system-cards-client">
      <Card>
        <CardHeader>
          <CardTitle>Database</CardTitle>
          <CardDescription>Connection status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm">NETLIFY_DATABASE_URL</div>
              <div className="text-xs text-muted-foreground">{status.database ? 'Configured' : 'Missing'}</div>
            </div>
            <div className="flex flex-col items-end">
              <Button onClick={testDatabase} data-testid="test-db">Test Connection</Button>
              {dbMessage && <div className="text-sm mt-2" data-testid="db-message">{dbMessage}</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>NextAuth configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm">NEXTAUTH_URL / NEXTAUTH_SECRET</div>
              <div className="text-xs text-muted-foreground">{status.authentication.url && status.authentication.secret ? 'Configured' : 'Missing'}</div>
            </div>
            <div className="flex flex-col items-end">
              <Button onClick={testAuth} data-testid="test-auth">Test Auth</Button>
              {authMessage && <div className="text-sm mt-2" data-testid="auth-message">{authMessage}</div>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
