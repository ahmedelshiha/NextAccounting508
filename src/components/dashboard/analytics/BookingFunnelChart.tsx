"use client"

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface ServiceBreakdown { service: string; revenue?: number; percentage?: number; count?: number }

export default function BookingFunnelChart({ data }: { data: ServiceBreakdown[] | undefined }) {
  if (!data || data.length === 0) return null

  const labels = data.map(d => d.service)
  const counts = data.map(d => (typeof d.count === 'number' ? d.count : Math.round((d.percentage || 0) * 100)))

  const chartData = {
    labels,
    datasets: [{ label: 'Bookings', data: counts, backgroundColor: labels.map((_, i) => ['#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#f472b6'][i % 6]) }]
  }

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } }
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="h-56">
        <Bar data={chartData as any} options={options as any} />
      </div>
    </div>
  )
}
