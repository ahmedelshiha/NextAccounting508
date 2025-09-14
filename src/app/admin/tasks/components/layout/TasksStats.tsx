import React from 'react'
import { Target, AlertCircle, Calendar, Timer, CheckCircle2, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { TaskStatistics } from '@/lib/tasks/types'

interface TasksStatsProps {
  stats: TaskStatistics
  timeRange?: string
  onTimeRangeChange?: (range: string) => void
}

export const TasksStats: React.FC<TasksStatsProps> = ({ stats, timeRange = 'week', onTimeRangeChange }) => {
  const statItems = [
    { label: 'Total Tasks', value: stats.total, icon: Target, color: 'text-gray-600', bgColor: 'bg-gray-50' },
    { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
    { label: 'Due Today', value: stats.dueToday, icon: Calendar, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { label: 'In Progress', value: stats.inProgress, icon: Timer, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Productivity', value: `${stats.productivity}%`, icon: BarChart3, color: 'text-purple-600', bgColor: 'bg-purple-50' }
  ]

  return (
    <div className="space-y-4">
      {onTimeRangeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Time Range:</span>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['today', 'week', 'month', 'quarter'].map(range => (
              <Button key={range} variant={timeRange === range ? 'default' : 'ghost'} size="sm" className="text-xs capitalize" onClick={() => onTimeRangeChange(range)}>
                {range}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statItems.map((stat, idx) => {
          const IconComponent = stat.icon
          return (
            <Card key={idx} className="text-center hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${stat.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Avg. Completion</div>
                <div className="text-lg font-semibold">{stats.averageCompletionTime} days</div>
              </div>
              <Timer className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Compliance Rate</div>
                <div className="text-lg font-semibold">{stats.complianceRate}%</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Due Soon</div>
                <div className="text-lg font-semibold">{stats.dueSoon}</div>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
