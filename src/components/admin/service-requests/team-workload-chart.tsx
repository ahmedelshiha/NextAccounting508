"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { apiFetch } from '@/lib/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface WorkloadResponse {
  data?: { utilization: number; activeMembers: number; distribution: { memberId: string; assigned: number; inProgress: number; completed: number }[] }
  note?: string
}

export default function TeamWorkloadChart() {
  const [data, setData] = useState<WorkloadResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const r = await apiFetch('/api/admin/team-management/workload')
        const j = await r.json().catch(() => ({})) as WorkloadResponse
        if (!ignore) setData(j.data ?? null)
      } finally { if (!ignore) setLoading(false) }
    })()
    return () => { ignore = true }
  }, [])

  const labels = useMemo(() => (data?.distribution || []).map(d => d.memberId.slice(0, 6)), [data])
  const assigned = useMemo(() => (data?.distribution || []).map(d => d.assigned), [data])
  const inProgress = useMemo(() => (data?.distribution || []).map(d => d.inProgress), [data])

  const chartData = {
    labels,
    datasets: [
      { label: 'Assigned', data: assigned, backgroundColor: '#93c5fd' },
      { label: 'In Progress', data: inProgress, backgroundColor: '#60a5fa' }
    ]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload</CardTitle>
        <CardDescription>Utilization: {data ? `${data.utilization}%` : '—'} (members: {data?.activeMembers ?? 0})</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400">Loading…</div>
        ) : labels.length ? (
          <Bar data={chartData} />
        ) : (
          <div className="text-sm text-gray-500">No workload data.</div>
        )}
      </CardContent>
    </Card>
  )
}
