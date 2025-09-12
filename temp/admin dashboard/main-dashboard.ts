// pages/admin/dashboard.tsx (or app/admin/dashboard/page.tsx for App Router)
'use client'

import React, { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useDashboardData } from '@/hooks/dashboard/useDashboardData'
import { useRealTimeUpdates } from '@/hooks/dashboard/useRealTimeUpdates'
import { useDashboardLoading, useDashboardError } from '@/stores/dashboardStore'

const AdminDashboard: React.FC = () => {
  // Initialize data loading and real-time updates
  useDashboardData()
  useRealTimeUpdates()
  
  const loading = useDashboardLoading()
  const error = useDashboardError()

  // Show loading skeleton during initial load
  if (loading) {
    return <DashboardSkeleton.Page />
  }

  // Show error state if data loading failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorBoundary>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Unavailable</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry Loading
            </button>
          </div>
        </ErrorBoundary>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardSkeleton.Page />}>
        <DashboardLayout />
      </Suspense>
    </ErrorBoundary>
  )
}

export default AdminDashboard

// components/dashboard/activity/ActivityFeed.tsx
import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookingsList } from './BookingsList'
import { TasksList } from './TasksList'
import { DeadlinesList } from './DeadlinesList'
import { useDashboardStore, useRecentActivity } from '@/stores/dashboardStore'

export const ActivityFeed: React.FC = memo(() => {
  const { activeActivityTab, setActiveActivityTab } = useDashboardStore()
  const { bookings, tasks } = useRecentActivity()

  const tabs = [
    { key: 'schedule', label: 'Schedule', count: bookings.length },
    { key: 'tasks', label: 'Tasks', count: tasks.length },
    { key: 'deadlines', label: 'Deadlines', count: 0 }
  ] as const

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Center</CardTitle>
            <CardDescription>Real-time business operations</CardDescription>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeActivityTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                className="text-xs relative"
                onClick={() => setActiveActivityTab(tab.key)}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-4 w-4 p-0">
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        {activeActivityTab === 'schedule' && <BookingsList bookings={bookings} />}
        {activeActivityTab === 'tasks' && <TasksList tasks={tasks} />}
        {activeActivityTab === 'deadlines' && <DeadlinesList />}
      </CardContent>
    </Card>
  )
})

ActivityFeed.displayName = 'ActivityFeed'

// components/dashboard/activity/BookingsList.tsx
import React, { memo, useState } from 'react'
import { Calendar, Clock, FileText, MapPin, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VirtualList } from '@/components/ui/VirtualList'

interface Booking {
  id: string
  clientName: string
  service: string
  scheduledAt: string
  duration: number
  status: string
  revenue: number
  priority: string
  location: string
  assignedTo?: string
  notes?: string
  isRecurring: boolean
}

interface BookingsListProps {
  bookings: Booking[]
}

export const BookingsList: React.FC<BookingsListProps> = memo(({ bookings }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'pending') return booking.status === 'pending'
    if (filterStatus === 'urgent') return booking.priority === 'high' || booking.priority === 'urgent'
    return true
  })

  const renderBookingItem = (booking: Booking) => (
    <div 
      key={booking.id}
      className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
        booking.priority === 'high' || booking.priority === 'urgent' 
          ? 'border-orange-200 bg-orange-50' 
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            booking.status === 'confirmed' ? 'bg-green-500' :
            booking.status === 'pending' ? 'bg-yellow-500' :
            booking.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
          }`} />
          <h3 className="font-medium text-gray-900">{booking.clientName}</h3>
          {booking.priority === 'high' && (
            <Badge variant="destructive" className="text-xs">High Priority</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{booking.status}</Badge>
          <span className="text-sm font-medium text-green-600">${booking.revenue}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{new Date(booking.scheduledAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{new Date(booking.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>{booking.service}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="capitalize">{booking.location.replace('_', ' ')}</span>
        </div>
      </div>
      
      {booking.notes && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
          <strong>Note:</strong> {booking.notes}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Assigned: {booking.assignedTo}</span>
          <span>Duration: {booking.duration}min</span>
          {booking.isRecurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-xs">
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
        </div>
      </div>
    </div>
  )

  if (filteredBookings.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No bookings match your filter</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="all">All Bookings</option>
          <option value="pending">Pending Only</option>
          <option value="urgent">Urgent Only</option>
        </select>
      </div>
      
      {filteredBookings.length > 5 ? (
        <VirtualList
          items={filteredBookings}
          height={400}
          itemHeight={160}
          renderItem={renderBookingItem}
          className="space-y-3"
        />
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(renderBookingItem)}
        </div>
      )}
    </div>
  )
})

BookingsList.displayName = 'BookingsList'

// components/dashboard/activity/TasksList.tsx
import React, { memo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Task {
  id: string
  title: string
  description?: string
  priority: string
  dueDate: string
  assignee?: string
  status: string
  category: string
  estimatedHours?: number
  actualHours?: number
  completionPercentage: number
}

interface TasksListProps {
  tasks: Task[]
}

export const TasksList: React.FC<TasksListProps> = memo(({ tasks }) => {
  const prioritizedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
           (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
  })

  if (prioritizedTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No urgent tasks</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {prioritizedTasks.map((task) => {
        const isOverdue = new Date(task.dueDate) < new Date()
        return (
          <div 
            key={task.id} 
            className={`p-4 rounded-lg border transition-all ${
              isOverdue ? 'border-red-200 bg-red-50' :
              task.priority === 'critical' || task.priority === 'high' 
                ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">{task.title}</h3>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    task.priority === 'critical' ? 'destructive' :
                    task.priority === 'high' ? 'default' : 'secondary'
                  }
                  className="text-xs"
                >
                  {task.priority}
                </Badge>
                {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
              </div>
            </div>
            
            {task.description && (
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
            )}
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">{task.completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    task.completionPercentage > 75 ? 'bg-green-500' :
                    task.completionPercentage > 50 ? 'bg-blue-500' :
                    task.completionPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${task.completionPercentage}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
              <div>Due: {new Date(task.dueDate).toLocaleDateString()}</div>
              <div>Est: {task.estimatedHours || 0}h</div>
              <div>Category: {task.category}</div>
              <div>Assignee: {task.assignee || 'Unassigned'}</div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <Badge variant="outline" className="text-xs">
                {task.status.replace('_', ' ')}
              </Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  Update
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  Details
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})

TasksList.displayName = 'TasksList'

// components/dashboard/activity/DeadlinesList.tsx
export const DeadlinesList: React.FC = memo(() => {
  return (
    <div className="text-center py-8">
      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">No upcoming deadlines</p>
    </div>
  )
})

DeadlinesList.displayName = 'DeadlinesList'
          </Button