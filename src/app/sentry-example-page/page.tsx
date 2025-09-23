"use client"

import * as React from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'

export default function SentryExamplePage() {
  const triggerClientError = () => {
    // Send an example error to Sentry without crashing the page
    Sentry.captureException(new Error('Sentry Frontend Test Error'))
    // Also attempt an undefined call to mimic framework guide
    try {
      ;(window as any).myUndefinedFunction()
    } catch {}
  }

  const triggerServerError = async () => {
    await fetch('/api/sentry-example', { cache: 'no-store' })
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">Sentry Example Page</h1>
      <p className="text-gray-600">Use these buttons to verify frontend and backend error reporting.</p>
      <div className="flex items-center gap-3">
        <Button onClick={triggerClientError}>Trigger Client Error</Button>
        <Button variant="outline" onClick={triggerServerError}>Trigger Server Error</Button>
      </div>
    </div>
  )
}
