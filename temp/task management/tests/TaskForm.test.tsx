import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TaskForm from '../components/forms/TaskForm'
import '@testing-library/jest-dom'

describe('TaskForm', () => {
  test('shows validation error when title is empty and calls onSave when valid', async () => {
    const onSave = vi.fn(() => Promise.resolve())
    const onCancel = vi.fn()

    render(<TaskForm mode="create" onSave={onSave} onCancel={onCancel} availableUsers={[]} />)

    const submit = screen.getByRole('button', { name: /create/i })
    fireEvent.click(submit)

    await waitFor(() => expect(screen.getByText('Title is required')).toBeInTheDocument())

    // Fill title and submit
    const titleInput = screen.getByLabelText('Title') as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'New Task' } })
    fireEvent.click(submit)

    await waitFor(() => expect(onSave).toHaveBeenCalled())
  })
})
