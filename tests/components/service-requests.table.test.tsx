import React from 'react'
import { render, screen } from '../../test-mocks/testing-library-react'
import ServiceRequestsTable, { type ServiceRequestItem } from '@/components/admin/service-requests/table'

describe('ServiceRequestsTable', () => {
  it('renders a row and view button without crashing (SSR)', () => {
    const items: ServiceRequestItem[] = [{
      id: 'sr1', title: 'Year-end Tax Filing', status: 'IN_REVIEW', priority: 'HIGH',
      client: { id: 'c1', name: 'Acme Corp', email: 'ops@acme.com' }, service: { id: 's1', name: 'Tax Prep', category: 'Tax' },
      assignedTeamMember: { id: 't1', name: 'Jane Doe', email: 'jane@example.com' },
      createdAt: '2025-01-01T10:00:00Z', paymentStatus: 'UNPAID', paymentAmountCents: 25000, paymentCurrency: 'USD',
      isBooking: true, bookingType: 'STANDARD', deadline: '2025-02-01T00:00:00Z'
    }]

    render(
      <ServiceRequestsTable
        items={items}
        selectedIds={new Set()}
        onToggle={() => {}}
        onToggleAll={() => {}}
        onOpen={() => {}}
      />
    )

    expect(screen.getByText('Year-end Tax Filing')).toBeTruthy()
    expect(screen.getByText('View')).toBeTruthy()
  })
})
