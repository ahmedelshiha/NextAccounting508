"use client"

import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface TrendPoint { month: string; revenue: number; target?: number }

export default function RevenueTrendChart({ data }: { data: TrendPoint[] | undefined }) {
  if (!data || data.length === 0) return null

  const labels = data.map(d => d.month)
  const revenue = data.map(d => d.revenue)
  const target = data.map(d => (typeof d.target === 'number' ? d.target : null))

  const datasets: any[] = [
    {
      label: 'Revenue',
      data: revenue,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.12)',
      tension: 0.3,
      fill: true,
      pointRadius: 2
    }
  ]

  // add target line if any point has target
  if (target.some(t => t !== null)) {
    datasets.push({
      label: 'Target',
      data: target.map((t) => (t === null ? undefined : t)),
      borderColor: '#f59e0b',
      borderDash: [6, 4],
      backgroundColor: 'transparent',
      tension: 0.2,
      pointRadius: 0
    })
  }

  const chartData = { labels, datasets }
  const options = {
    responsive: true,
    plugins: { legend: { position: 'bottom' as const } },
    scales: { y: { beginAtZero: true } }
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="h-56">
        <Line data={chartData as any} options={options as any} />
      </div>
    </div>
  )
}
