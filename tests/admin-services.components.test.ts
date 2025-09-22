import { render, screen } from '@/../test-mocks/testing-library-react'
import { ServiceForm } from '@/components/admin/services/ServiceForm'
import { BulkActionsPanel } from '@/components/admin/services/BulkActionsPanel'
import { ServicesAnalytics } from '@/components/admin/services/ServicesAnalytics'

vi.mock('lucide-react', () => ({ Plus: () => null, X: () => null, DollarSign: () => null, Clock: () => null, Tag: () => null, BarChart3: () => null, TrendingUp: () => null, TrendingDown: () => null, Users: () => null, Target: () => null }))

describe('Admin Services components', () => {
  it('ServiceForm renders basic sections', () => {
    render(<ServiceForm initialData={null as any} onSubmit={async () => {}} onCancel={() => {}} categories={['Tax']} />)
    expect(screen.getByText('Basic Information').textContent).toContain('Basic')
    expect(screen.getByText('Pricing & Duration').textContent).toContain('Pricing')
  })

  it('BulkActionsPanel shows selection summary and controls', () => {
    render(<BulkActionsPanel selectedIds={['a','b']} onClearSelection={() => {}} onBulkAction={async () => {}} categories={['Tax','HR']} />)
    expect(screen.getByText('selected').textContent).toContain('selected')
    expect(screen.getByText('Bulk Action').textContent).toContain('Bulk')
  })

  it('ServicesAnalytics renders fallback when analytics is null', () => {
    render(<ServicesAnalytics analytics={null} />)
    expect(screen.getByText('Analytics Unavailable').textContent).toContain('Analytics')
  })
})