import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

// Ensure initial fetch returns empty list
beforeEach(() => {
  // @ts-ignore
  globalThis.fetch = vi.fn(async () => new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
})

describe('TaskProvider optimistic flows', () => {
  it('adds task optimistically and replaces with created', async () => {
    vi.resetModules()
    vi.doMock('@/lib/api', () => ({ apiFetch: vi.fn(async () => ({ ok: true, json: async () => ({ id: '1', title: 'New' }) })) }))
    const { TaskProvider, useTasks } = await import('../providers/TaskProvider')

    const Probe: React.FC = () => {
      const { tasks, createTask } = useTasks()
      React.useEffect(() => { createTask({ title: 'New' }) }, [createTask])
      return <ul>{tasks.map(t => <li key={t.id}>{t.id}</li>)}</ul>
    }

    render(<TaskProvider><Probe /></TaskProvider>)
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())
  })

  it('rolls back on create failure', async () => {
    vi.resetModules()
    vi.doMock('@/lib/api', () => ({ apiFetch: vi.fn(async () => ({ ok: false, status: 500 })) }))
    const { TaskProvider, useTasks } = await import('../providers/TaskProvider')

    const Probe: React.FC = () => {
      const { tasks, createTask } = useTasks()
      React.useEffect(() => { createTask({ title: 'Fail' }) }, [createTask])
      return <div data-count={tasks.length} />
    }

    render(<TaskProvider><Probe /></TaskProvider>)
    await waitFor(() => expect(document.querySelector('[data-count="0"]')).toBeTruthy())
  })
})
