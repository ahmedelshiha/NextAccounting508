import { render, screen } from '../../test-mocks/testing-library-react'
import AnalyticsPage from '@/components/dashboard/templates/AnalyticsPage'

const stats = {
  revenue: { current: 125000, target: 200000, targetProgress: 62.5, trend: 4.2 },
  bookings: { total: 320, today: 5, pending: 2, conversion: 37.5 },
  clients: { active: 210, new: 3, retention: 92.1, satisfaction: 4.6 },
  tasks: { productivity: 86.3, completed: 28, overdue: 1, dueToday: 4 }
}

describe('AnalyticsPage', () => {
  it('renders KPI grid and headings in SSR', () => {
    render(
      <AnalyticsPage
        title="Overview"
        stats={stats}
        revenueTrend={[{ month: 'Jan', revenue: 10000 }, { month: 'Feb', revenue: 12000 }]}
      />
    )

    expect(screen.getByText('Overview')).toBeTruthy()
    expect(screen.getByText('Key Performance Indicators')).toBeTruthy()
    expect(screen.getByText('Revenue Performance')).toBeTruthy()
  })
})
