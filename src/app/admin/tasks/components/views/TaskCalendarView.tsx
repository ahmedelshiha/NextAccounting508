import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Task } from '../../task-types'

interface TaskCalendarViewProps {
  tasks: Task[]
  loading?: boolean
  onTaskEdit?: (task: Task) => void
  onTaskView?: (task: Task) => void
  currentDate?: Date
  onDateChange?: (date: Date) => void
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({ tasks, loading = false, onTaskEdit, onTaskView, currentDate = new Date(), onDateChange }) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    tasks.forEach(task => {
      const dateKey = new Date(task.dueDate).toDateString()
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(task)
    })
    return grouped
  }, [tasks])

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: Date[] = []
    const currentDay = new Date(startDate)
    for (let i = 0; i < 42; i++) { days.push(new Date(currentDay)); currentDay.setDate(currentDay.getDate() + 1) }
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1)
    else newDate.setMonth(newDate.getMonth() + 1)
    onDateChange?.(newDate)
  }

  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth()
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4" />
            <div className="grid grid-cols-7 gap-2 mb-4">{Array.from({ length: 7 }).map((_, i) => (<div key={i} className="h-8 bg-gray-200 rounded" />))}</div>
            <div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }).map((_, i) => (<div key={i} className="h-24 bg-gray-200 rounded" />))}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map(mode => (
              <Button key={mode} variant={viewMode === mode ? 'default' : 'ghost'} size="sm" className="text-xs capitalize" onClick={() => setViewMode(mode)}>
                {mode}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {getCalendarDays().map((date, idx) => {
            const dateKey = date.toDateString()
            const dayTasks = tasksByDate[dateKey] || []
            const isCurrentMonthDay = isCurrentMonth(date)
            const isTodayDate = isToday(date)
            return (
              <div key={idx} className={`min-h-[120px] border rounded-lg p-2 ${isCurrentMonthDay ? 'bg-white' : 'bg-gray-50 text-gray-400'} ${isTodayDate ? 'ring-2 ring-blue-500' : ''} hover:bg-gray-50 cursor-pointer`}>
                <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600' : ''}`}>{date.getDate()}</div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200" onClick={() => onTaskView?.(task)} title={task.title}>
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (<div className="text-xs text-gray-500 font-medium">+{dayTasks.length - 3} more</div>)}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
