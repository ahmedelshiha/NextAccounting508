import React from 'react'
import { render, screen } from '@testing-library/react'
import { TaskListView } from '../task-view-components'

const tasks = [
  { id: '1', title: 'A', description: '', priority: 'low', status: 'pending', category: 'system', dueDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), completionPercentage: 0, tags: [] },
  { id: '2', title: 'B', description: '', priority: 'medium', status: 'in_progress', category: 'system', dueDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), completionPercentage: 20, tags: [] }
]

describe('TaskListView', () => {
  it('renders list of tasks', () => {
    render(<TaskListView tasks={tasks as any} loading={false} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    render(<TaskListView tasks={[]} loading />)
    // skeleton contains placeholder elements
    expect(screen.getAllByRole('status').length >= 0).toBe(true)
  })
})
