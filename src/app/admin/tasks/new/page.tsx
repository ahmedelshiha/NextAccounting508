'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TaskProvider, useTasks } from '../providers/TaskProvider'
import TaskForm from '../components/forms/TaskForm'
import { apiFetch } from '@/lib/api'

function NewTaskContent() {
  const router = useRouter()
  const { createTask } = useTasks()
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const res = await apiFetch('/api/admin/team-members')
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        const list = Array.isArray(data) ? data : (data?.teamMembers || [])
        const mapped = list.map((m: any) => ({ id: m.userId || m.id, name: m.name || m.email || 'Unknown' }))
        if (!ignore) setAvailableUsers(mapped.filter((u: any) => !!u.id))
      } catch (e) {
        // ignore
      }
    })()
    return () => { ignore = true }
  }, [])

  const handleSave = async (data: any) => {
    const created = await createTask({
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      assigneeId: data.assigneeId || undefined,
    })
    if (created) router.push('/admin/tasks')
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Create Task</h1>
        <Button variant="ghost" onClick={() => router.push('/admin/tasks')}>Back</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <TaskForm mode="create" availableUsers={availableUsers} onSave={handleSave} onCancel={() => router.push('/admin/tasks')} />
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminNewTaskPage() {
  return (
    <TaskProvider>
      <NewTaskContent />
    </TaskProvider>
  )
}
