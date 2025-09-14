import type { Task } from '../../task-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TaskGanttViewProps {
  tasks: Task[]
  loading?: boolean
  onTaskView?: (task: Task) => void
}

// Simple monthly Gantt scaffold: time axis = current month. Bars positioned by start/end.
export const TaskGanttView: React.FC<TaskGanttViewProps> = ({ tasks, loading = false, onTaskView }) => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const totalDays = monthEnd.getDate()

  const days = useMemo(() => Array.from({ length: totalDays }, (_, i) => new Date(now.getFullYear(), now.getMonth(), i + 1)), [totalDays, now])

  const clampToMonth = (d: Date) => {
    if (d < monthStart) return monthStart
    if (d > monthEnd) return monthEnd
    return d
  }

  const toPct = (date: Date) => {
    const dayIndex = date.getDate() - 1
    return (dayIndex / totalDays) * 100
  }

  const toBar = (t: Task) => {
    const end = clampToMonth(new Date(t.completedAt || t.dueDate))
    // Heuristic start: createdAt, else 7 days before dueDate
    const startGuess = t.createdAt ? new Date(t.createdAt) : new Date(new Date(t.dueDate).getTime() - 7 * 86400000)
    const start = clampToMonth(startGuess)
    const left = Math.max(0, toPct(start))
    const right = Math.min(100, toPct(end))
    const width = Math.max(0, right - left)
    return { left: `${left}%`, width: `${width}%` }
  }

  const statusColor = (s: Task['status']) => (
    s === 'completed' ? 'bg-green-500' :
    s === 'in_progress' ? 'bg-blue-500' :
    s === 'blocked' ? 'bg-red-500' :
    s === 'review' ? 'bg-purple-500' :
    'bg-gray-400'
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Gantt (Month View)</CardTitle>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> In Progress</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Completed</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Blocked</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-400" /> Other</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Time Axis */}
        <div className="border-b pb-2 mb-2 overflow-x-auto">
          <div className="relative min-w-[800px]">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(24px, 1fr))` }}>
              {days.map((d, i) => (
                <div key={i} className="text-[10px] text-gray-500 text-center">
                  {d.getDate()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-2 overflow-x-auto">
          {tasks.map((t) => (
            <div key={t.id} className="relative min-w-[800px]">
              <div className="grid items-center" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(24px, 1fr))` }}>
                {/* Row background grid */}
                {days.map((_, i) => (
                  <div key={i} className={`h-8 ${i % 7 === 0 ? 'bg-gray-50' : ''} border-b`} />
                ))}
                {/* Task bar */}
                <div className="absolute inset-y-0" style={{ left: toBar(t).left, width: toBar(t).width }}>
                  <button
                    className={`h-6 mt-1 rounded shadow-sm ${statusColor(t.status)} hover:opacity-90 text-white text-[10px] px-2 truncate`}
                    title={t.title}
                    onClick={() => onTaskView?.(t)}
                  >
                    {t.title}
                  </button>
                </div>
              </div>
              <div className="absolute -left-2 top-0 translate-x-[-100%] text-xs text-gray-700 truncate max-w-[200px] pr-2">
                {t.title}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">No tasks available for the current month.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
