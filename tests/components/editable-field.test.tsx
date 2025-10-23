import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditableField from '@/components/admin/profile/EditableField'

describe('EditableField Component', () => {
  it('renders field in view mode', () => {
    render(
      <EditableField
        label="Test Field"
        value="test value"
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('Test Field')).toBeInTheDocument()
    expect(screen.getByText('test value')).toBeInTheDocument()
  })

  it('switches to edit mode on click', async () => {
    const user = userEvent.setup()
    render(
      <EditableField
        label="Test Field"
        value="test value"
        onSave={vi.fn()}
      />
    )

    const button = screen.getByRole('button', { name: /Test Field/i })
    await user.click(button)

    expect(screen.getByDisplayValue('test value')).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <EditableField
        label="Email"
        value="old@example.com"
        fieldType="email"
        onSave={onSave}
      />
    )

    const button = screen.getByRole('button', { name: /Email/i })
    await user.click(button)

    const input = screen.getByDisplayValue('old@example.com')
    await user.clear(input)
    await user.type(input, 'invalid-email')

    const saveBtn = screen.getByRole('button', { name: /Save/i })
    await user.click(saveBtn)

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Invalid email address')).toBeInTheDocument()
  })

  it('accepts valid email and calls onSave', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <EditableField
        label="Email"
        value="old@example.com"
        fieldType="email"
        onSave={onSave}
      />
    )

    const button = screen.getByRole('button', { name: /Email/i })
    await user.click(button)

    const input = screen.getByDisplayValue('old@example.com')
    await user.clear(input)
    await user.type(input, 'new@example.com')

    const saveBtn = screen.getByRole('button', { name: /Save/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('new@example.com')
    })
  })

  it('shows character count for text fields', async () => {
    const user = userEvent.setup()
    render(
      <EditableField
        label="Name"
        value="John"
        fieldType="text"
        onSave={vi.fn()}
      />
    )

    const button = screen.getByRole('button', { name: /Name/i })
    await user.click(button)

    expect(screen.getByText(/4\/200/)).toBeInTheDocument()
  })

  it('cancels edit on Escape key', async () => {
    const user = userEvent.setup()
    render(
      <EditableField
        label="Test"
        value="original"
        onSave={vi.fn()}
      />
    )

    const button = screen.getByRole('button', { name: /Test/i })
    await user.click(button)

    const input = screen.getByDisplayValue('original')
    await user.type(input, ' modified')
    await user.keyboard('{Escape}')

    // Should be back in view mode
    expect(screen.getByText('original')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('original modified')).not.toBeInTheDocument()
  })

  it('saves on Enter key', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <EditableField
        label="Test"
        value="original"
        onSave={onSave}
      />
    )

    const button = screen.getByRole('button', { name: /Test/i })
    await user.click(button)

    const input = screen.getByDisplayValue('original')
    await user.clear(input)
    await user.type(input, 'modified')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('modified')
    })
  })

  it('disables save button when value unchanged', async () => {
    const user = userEvent.setup()
    render(
      <EditableField
        label="Test"
        value="original"
        onSave={vi.fn()}
      />
    )

    const button = screen.getByRole('button', { name: /Test/i })
    await user.click(button)

    const saveBtn = screen.getByRole('button', { name: /Save/i })
    expect(saveBtn).toBeDisabled()
  })

  it('shows masked value for password fields', () => {
    render(
      <EditableField
        label="Password"
        value="secret"
        masked={true}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('••••••')).toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })
})
