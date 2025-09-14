import React from 'react'
import { render, screen } from '@testing-library/react'
import { TaskCard } from '../components/cards/TaskCard'

const mockTask = {
  id: 't1',
  title: 'Test Task',
  description: 'A sample task',
  priority: 'medium',
  status: 'pending',
  category: 'system',
  dueDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completionPercentage: 0,
  tags: []
}

describe('TaskCard', () => {
  it('renders title and controls', () => {
    render(<TaskCard task={mockTask as any} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    // Actions (Start button) should be present since status is pending
    expect(screen.getByText(/Start|Complete/i)).toBeInTheDocument()
  })
})
