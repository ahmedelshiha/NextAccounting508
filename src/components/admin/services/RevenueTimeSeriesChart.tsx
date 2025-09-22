import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ServiceAnalytics } from '@/types/services'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Props {
  revenueTimeSeries?: ServiceAnalytics['revenueTimeSeries']
  className?: string
}

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6']

export default function RevenueTimeSeriesChart({ revenueTimeSeries, className = '' }: Props) {
  if (!revenueTimeSeries || revenueTimeSeries.length === 0) return null

  const labels = revenueTimeSeries[0].monthly.map(m => m.month)
  const datasets = revenueTimeSeries.map((s, idx) => ({
    label: s.service,
    data: s.monthly.map(m => m.revenue),
    borderColor: COLORS[idx % COLORS.length],
    backgroundColor: COLORS[idx % COLORS.length],
    tension: 0.3,
    fill: false,
  }))

  const data = { labels, datasets }
  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  }

  return (
    <div className={className}>
      <Line data={data} options={options as any} />
    </div>
  )
}
