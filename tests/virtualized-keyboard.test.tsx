import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import VirtualizedTaskList from '../src/app/admin/tasks/virtualized-task-list'

const tasks = Array.from({ length: 20 }).map((_, i) => ({ id: `t${i+1}`, title: `Task ${i+1}` }))

describe('VirtualizedTaskList keyboard navigation', () => {
  it('navigates with arrow keys and activates item with Enter', () => {
    const onActivate = vi.fn()
    render(<VirtualizedTaskList tasks={tasks} itemHeight={50} renderItem={(t: any) => <div>{t.title}</div>} onActivate={onActivate} />)

    const listbox = screen.getByRole('listbox')
    listbox.focus()

    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'Enter' })

    expect(onActivate).toHaveBeenCalled()
  })
})
