import React, { useMemo } from 'react'
import { useTaskAnalytics } from '../../hooks/useTaskAnalytics'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title)

function titleCase(input: string): string {
  return input?.toString()?.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''
}

export default function TaskAnalytics() {
  const { loading, error, stats } = useTaskAnalytics()

  // derive data early so hooks (useMemo) are called unconditionally
  const status = stats?.byStatus || []
  const priority = stats?.byPriority || []

  const statusData = useMemo(() => {
    const labels = status.map((s: any) => titleCase(s.status))
    const data = status.map((s: any) => s?._count?._all ?? 0)
    return {
      labels,
      datasets: [
        {
          label: 'Tasks',
          data,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'],
          borderWidth: 0,
        },
      ],
    }
  }, [status])

  const priorityData = useMemo(() => {
    const labels = priority.map((p: any) => titleCase(p.priority))
    const data = priority.map((p: any) => p?._count?._all ?? 0)
    return {
      labels,
      datasets: [
        {
          label: 'Count',
          data,
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
          borderWidth: 0,
        },
      ],
    }
  }, [priority])

  if (loading) return <div className="p-4 bg-white border rounded">Loading analytics...</div>
  if (error) return <div className="p-4 bg-red-50 border rounded text-red-700">{error}</div>

  return (
    <div className="bg-white border rounded p-4">
      <h3 className="text-lg font-semibold mb-3">Task Analytics</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600">Total tasks</div>
          <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold">{stats?.completed ?? 0}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-600 mb-2">By status</div>
            {status.length ? (
              <Doughnut
                data={statusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' as const } },
                }}
              />
            ) : (
              <div className="text-sm text-gray-500">No status data</div>
            )}
          </div>

          <div className="p-3 border rounded">
            <div className="text-sm text-gray-600 mb-2">By priority</div>
            {priority.length ? (
              <div className="h-48">
                <Bar
                  data={priorityData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { grid: { display: false } },
                      y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    },
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            ) : (
              <div className="text-sm text-gray-500">No priority data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
