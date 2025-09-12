import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import BoardAccessible from '../src/app/admin/tasks/board-accessible'

const tasks = [
  { id: 't1', title: 'One', status: 'pending' },
  { id: 't2', title: 'Two', status: 'in_progress' },
]

describe('BoardAccessible keyboard interactions', () => {
  it('picks up and drops a card with keyboard', () => {
    const onMove = vi.fn()
    const onReorder = vi.fn()
    render(<BoardAccessible tasks={tasks as any} onMove={onMove} onReorder={onReorder} renderCard={(t) => <div>{(t as any).title}</div>} />)

    const firstCard = screen.getByLabelText(/Task One/i)
    firstCard.focus()
    fireEvent.keyDown(firstCard, { key: ' ' }) // pick up
    // move focus to second column card
    const secondCard = screen.getByLabelText(/Task Two/i)
    secondCard.focus()
    fireEvent.keyDown(secondCard, { key: 'Enter' }) // drop

    expect(onReorder).toHaveBeenCalled()
  })
})
