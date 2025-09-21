"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function RunRemindersButton() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string>('')
  async function run() {
    setRunning(true)
    setResult('')
    try {
      const res = await fetch('/api/admin/reminders/run', { method: 'POST' })
      const json = await res.json().catch(() => null)
      setResult(res.ok ? `Processed: ${json?.processed ?? 0}` : (json?.error || 'Failed'))
    } catch {
      setResult('Failed')
    } finally { setRunning(false) }
  }
  return (
    <div className="flex items-center gap-3">
      <Button onClick={run} disabled={running}>{running ? 'Running…' : 'Run now'}</Button>
      {result && <span className="text-sm text-gray-600">{result}</span>}
    </div>
  )
}
