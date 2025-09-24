"use client"

import AnalyticsPage from '@/components/dashboard/templates/AnalyticsPage'

export default function AnalyticsPagePreview() {
  const stats = {
    revenue: { current: 45230, target: 60000, targetProgress: 75.4, trend: 6.2 },
    bookings: { total: 340, today: 12, pending: 8, conversion: 42.7 },
    clients: { active: 128, new: 6, retention: 88.3, satisfaction: 4.2 },
    tasks: { productivity: 79.5, completed: 23, overdue: 3, dueToday: 4 },
  }
  const revenueTrend = [
    { month: 'Jan', revenue: 32000, target: 30000 },
    { month: 'Feb', revenue: 35000, target: 32000 },
    { month: 'Mar', revenue: 41000, target: 34000 },
    { month: 'Apr', revenue: 38000, target: 36000 },
    { month: 'May', revenue: 45230, target: 38000 },
  ]

  return (
    <AnalyticsPage
      title="Analytics Template Preview"
      subtitle="KPI grid and example revenue trend"
      primaryAction={{ label: 'Refresh', onClick: () => alert('Refresh') }}
      stats={stats}
      revenueTrend={revenueTrend}
    />
  )
}
