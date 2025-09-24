"use client"

import useSWR from 'swr'
import RevenueTrendChart from './RevenueTrendChart'
import BookingFunnelChart from './BookingFunnelChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, Star } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(async (r) => {
  if (!r.ok) throw new Error((await r.json().catch(() => ({ error: r.statusText }))).error || 'Request failed')
  return r.json()
})

export default function BusinessIntelligence({ dashboard }: { dashboard: any }) {
  const { data: analytics, error } = useSWR<unknown>('/api/admin/analytics?range=30d', fetcher, { revalidateOnFocus: false })

  const serviceLabels = (analytics as any)?.revenueByService?.map((s: any) => s.service) || []
  const serviceValues = (analytics as any)?.revenueByService?.map((s: any) => s.amount) || []
  const pieData: ChartData<'pie', number[], string> = {
    labels: serviceLabels,
    datasets: [{ label: 'Revenue by Service', data: serviceValues, backgroundColor: ['#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#f472b6'], borderWidth: 0 }]
  }
  const pieOptions: ChartOptions<'pie'> = { plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }

  const dailyLabels = (analytics as any)?.dailyBookings?.map((d: any, i: number) => (d as any).date || `D${i+1}`) || []
  const dailyValues = (analytics as any)?.dailyBookings?.map((d: any) => d.count) || []
  const barData: ChartData<'bar', number[], string> = { labels: dailyLabels, datasets: [{ label: 'Daily Bookings', data: dailyValues, backgroundColor: '#93c5fd' }] }
  const barOptions: ChartOptions<'bar'> = { plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { x: { ticks: { display: false } } } }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Revenue Performance</h3>
        <div className="bg-white rounded-lg border p-4">
          {error ? (<div className="text-sm text-red-600">Analytics unavailable. Showing fallback.</div>) : null}
          <RevenueTrendChart data={(analytics as any)?.monthlyTrend || (dashboard?.revenueAnalytics?.monthlyTrend ?? [])} />
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            {((analytics as any)?.serviceBreakdown || dashboard?.revenueAnalytics?.serviceBreakdown || []).slice(0,3).map((service: any, idx: number) => (
              <div key={idx} className="text-center">
                <div className="font-medium">{Math.round(((service.revenue || 0)) / Math.max(1, ((analytics as any)?.serviceBreakdown || dashboard?.revenueAnalytics?.serviceBreakdown || []).reduce((a: any,b: any)=>a+(b.revenue||0),0)) * 100)}%</div>
                <div className="text-gray-600 truncate">{service.service}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-600">
          Current: ${'${dashboard?.stats?.revenue?.current?.toLocaleString() ?? 0}'} • Target: ${'${dashboard?.stats?.revenue?.target?.toLocaleString() ?? 0}'} • <span className="text-green-600">+{(dashboard?.stats?.revenue?.trend ?? 0)}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Operational Metrics</h3>
        <BookingFunnelChart data={(analytics as any)?.serviceBreakdown || dashboard?.revenueAnalytics?.serviceBreakdown || []} />
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Booking Utilization</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${dashboard?.performanceMetrics?.efficiency?.bookingUtilization ?? 0}%` }} />
              </div>
              <span className="text-sm font-medium">{dashboard?.performanceMetrics?.efficiency?.bookingUtilization ?? 0}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Client Satisfaction</span>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{dashboard?.performanceMetrics?.efficiency?.clientSatisfaction ?? 0}/5.0</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Task Completion Rate</span>
            <span className="text-sm font-medium text-green-600">{dashboard?.performanceMetrics?.efficiency?.taskCompletionRate ?? 0}%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Show Rate</span>
            <span className="text-sm font-medium">{dashboard?.performanceMetrics?.operational?.appointmentShowRate ?? 0}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
