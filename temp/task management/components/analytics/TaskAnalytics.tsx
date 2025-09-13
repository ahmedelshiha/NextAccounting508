import React from 'react'
import { useTaskAnalytics } from '../../hooks/useTaskAnalytics'

export default function TaskAnalytics() {
  const { loading, error, stats } = useTaskAnalytics()

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
        <div className="col-span-2">
          <div className="text-sm text-gray-600">By status</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(stats?.byStatus || []).map((s: any) => (
              <div key={s.status} className="p-2 border rounded">
                <div className="text-xs text-gray-500">{s.status}</div>
                <div className="font-semibold">{s._count?._all ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-sm text-gray-600">By priority</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(stats?.byPriority || []).map((p: any) => (
              <div key={p.priority} className="p-2 border rounded">
                <div className="text-xs text-gray-500">{p.priority}</div>
                <div className="font-semibold">{p._count?._all ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
