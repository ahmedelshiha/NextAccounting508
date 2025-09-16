"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  distribution: Record<string, number>
  loading?: boolean
}

const COLORS = ['#60a5fa','#34d399','#fbbf24','#f43f5e','#a78bfa','#f59e0b','#10b981','#93c5fd']

export default function RequestStatusDistribution({ distribution, loading }: Props) {
  const labels = useMemo(() => Object.keys(distribution), [distribution])
  const values = useMemo(() => labels.map(l => distribution[l] ?? 0), [labels, distribution])

  const data = {
    labels,
    datasets: [
      { data: values, backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]) }
    ]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>Current breakdown by status</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400">Loading…</div>
        ) : labels.length ? (
          <Pie data={data} />
        ) : (
          <div className="text-sm text-gray-500">No data available.</div>
        )}
      </CardContent>
    </Card>
  )
}
