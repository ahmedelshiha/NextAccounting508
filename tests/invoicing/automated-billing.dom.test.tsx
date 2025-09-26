import { describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AutomatedBillingSequences from '@/components/invoicing/automated-billing'

describe('AutomatedBillingSequences UI (SSR snapshot-ish)', () => {
  it('renders form fields and preview list with defaults', () => {
    render(<AutomatedBillingSequences />)
    screen.getByText('Automated Billing Sequences')
    screen.getByText('Create a recurring invoice schedule with predictable cadence.')
    screen.getByText('Next runs')
    screen.getByText('USD 500.00')
    screen.getByText('Save Sequence')
  })
})
