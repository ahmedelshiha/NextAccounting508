'use client'

import { useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'

export default function QuickTaskPage() {
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const submit = async () => {
    if (!title.trim()) { setMsg('Title is required'); return }
    setSubmitting(true)
    setMsg(null)
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        priority,
      }
      const res = await apiFetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        setMsg(res.status === 501 ? 'Database not configured. Demo mode only.' : 'Failed to create task')
      } else {
        setMsg('Task created')
        setTitle(''); setDueAt(''); setPriority('MEDIUM'); setNotes('')
      }
    } catch {
      setMsg('Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quick Task</h1>
            <p className="text-gray-600">Create a simple task quickly</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild><Link href="/admin">Back to Dashboard</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/tasks">View Tasks</Link></Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Task</CardTitle>
            <CardDescription>Only title, due date and priority are required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {msg && <div className="border rounded-md p-2 text-sm bg-gray-50">{msg}</div>}
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex flex-wrap items-center gap-3">
              <Select value={priority} onValueChange={(v) => setPriority(v as 'LOW' | 'MEDIUM' | 'HIGH')}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <Button onClick={submit} disabled={submitting} className="mt-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Plus className="h-4 w-4 mr-2"/>}
              Create Task
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
