import React from 'react'
import { render, screen } from '@testing-library/react'
import { TaskGanttView } from '../components/views/TaskGanttView'
import type { Task } from '@/lib/tasks/types'

const makeTask = (id: string, day: number): Task => ({
  id,
  title: `Task ${id}`,
  description: '',
  priority: 'medium',
  status: 'in_progress',
  category: 'system',
  dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), Math.min(28, day)).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  estimatedHours: 1,
  assignee: undefined,
  collaborators: [],
  createdBy: { id: 'u', name: 'U', email: 'u@e.com', role: 'ADMIN' },
  completionPercentage: 0,
  progress: [],
  dependencies: [],
  tags: [],
  customFields: {},
  attachments: [],
  comments: [],
  reminders: [],
  watchers: []
})

test('renders a bar per task', () => {
  const tasks = [makeTask('1', 5), makeTask('2', 12), makeTask('3', 20)]
  render(<TaskGanttView tasks={tasks} />)
  tasks.forEach(t => expect(screen.getByText(t.title)).toBeInTheDocument())
})
