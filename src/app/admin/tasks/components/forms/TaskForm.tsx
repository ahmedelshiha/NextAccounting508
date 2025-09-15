'use client'

'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TaskFormSchema, TaskFormValues } from '../../schemas/task'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TaskFormProps {
  task?: any
  mode: 'create' | 'edit'
  availableUsers?: { id: string; name: string }[]
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export default function TaskForm({ task, mode, availableUsers = [], onSave, onCancel }: TaskFormProps) {
  const defaultValues: Partial<TaskFormValues> = {
    title: task?.title || '',
    description: task?.description || '',
    priority: (task?.priority || 'medium') as any,
    dueDate: task?.dueDate ? String(task.dueDate).slice(0, 10) : (task?.dueAt ? String(task.dueAt).slice(0, 10) : undefined),
    assigneeId: task?.assigneeId || undefined,
  }

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema) as any,
    defaultValues: defaultValues as TaskFormValues,
  })

  React.useEffect(() => { reset(defaultValues) }, [task])

  const onSubmit = async (data: TaskFormValues) => {
    const payload = {
      title: data.title.trim(),
      description: data.description?.trim(),
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      assigneeId: data.assigneeId || undefined,
    }
    await onSave(payload)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Title</label>
        <Input {...register('title')} aria-invalid={!!errors.title} />
        {errors.title && <div className="text-xs text-red-600 mt-1">{errors.title.message}</div>}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Description</label>
        <Textarea {...register('description')} className="min-h-[80px]" />
        {errors.description && <div className="text-xs text-red-600 mt-1">{errors.description.message}</div>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Priority</label>
          <select {...register('priority')} className="border rounded px-2 py-1 w-full">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Due date</label>
          <Input type="date" {...register('dueDate')} />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Assignee</label>
          <select {...register('assigneeId')} className="border rounded px-2 py-1 w-full">
            <option value="">Unassigned</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}</Button>
      </div>
    </form>
  )
}
