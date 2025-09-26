"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Calendar as CalendarIcon, LineChart as LineChartIcon } from 'lucide-react'
import { formatCurrencyFromDecimal } from '@/lib/decimal-utils'
import { apiFetch } from '@/lib/api'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export interface BookingForFinance {
  id: string
  scheduledAt: string
  status: string
  duration?: number
  service: {
    name: string
    price?: number | null
  }
}

interface Props {
  bookings?: BookingForFinance[]
}

function toMonthKey(dateStr: string) {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

function lastNMonthKeys(n: number): string[] {
  const now = new Date()
  const list: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    list.push(key)
  }
  return list
}

export function FinancialDashboard({ bookings: incoming }: Props) {
  const [bookings, setBookings] = useState<BookingForFinance[] | null>(incoming || null)
  const [loading, setLoading] = useState<boolean>(!incoming)

  useEffect(() => {
    if (incoming) return
    let ignore = false
    async function load() {
      try {
        const res = await apiFetch('/api/bookings')
        if (!ignore && res.ok) {
          const json = await res.json().catch(() => null as any)
          const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : [])
          setBookings(list as BookingForFinance[])
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [incoming])

  const now = new Date()

  const metrics = useMemo(() => {
    const src = bookings || []
    let upcomingCount = 0
    let upcomingValue = 0
    let past30Value = 0

    const monthlyMap = new Map<string, number>()

    for (const b of src) {
      const when = new Date(b.scheduledAt)
      const price = typeof b.service?.price === 'number' ? b.service.price! : 0
      const isUpcoming = when > now && (b.status === 'PENDING' || b.status === 'CONFIRMED')
      const isPast30 = when <= now && (now.getTime() - when.getTime()) <= 30 * 24 * 3600 * 1000

      const mk = toMonthKey(b.scheduledAt)
      monthlyMap.set(mk, (monthlyMap.get(mk) || 0) + price)

      if (isUpcoming) {
        upcomingCount += 1
        upcomingValue += price
      }
      if (isPast30) past30Value += price
    }

    const months = lastNMonthKeys(6)
    const monthly = months.map((m) => monthlyMap.get(m) || 0)

    return { upcomingCount, upcomingValue, past30Value, months, monthly }
  }, [bookings, now])

  if (loading) {
    return (
      <section className="mb-8" aria-busy="true">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
      </section>
    )
  }

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            <CalendarIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upcomingCount}</div>
            <CardDescription className="text-xs">Next 30 days</CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyFromDecimal(metrics.upcomingValue)}</div>
            <CardDescription className="text-xs">Based on booked services</CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyFromDecimal(metrics.past30Value)}</div>
            <CardDescription className="text-xs">Completed and past bookings</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Monthly Booked Value</CardTitle>
            <CardDescription className="text-xs">Sum of service prices by booking month</CardDescription>
          </div>
          <LineChartIcon className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <Bar
            data={{
              labels: metrics.months,
              datasets: [
                {
                  label: 'Booked Value',
                  data: metrics.monthly,
                  backgroundColor: 'rgba(37, 99, 235, 0.6)',
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { enabled: true } },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: (v) => `$${Number(v).toLocaleString()}` } },
              },
            }}
            height={280}
          />
        </CardContent>
      </Card>
    </section>
  )
}
