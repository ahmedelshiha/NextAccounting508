/**
 * Admin Calendar Workspace
 * 
 * Comprehensive calendar view for admin dashboard that displays:
 * - Client bookings with status indicators
 * - Task deadlines and assignments
 * - Team availability and workload
 * - Real-time updates via SSE
 * - Export capabilities
 * - Filtering and view controls
 */

'use client'

import { useState, useMemo } from 'react'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import { useUnifiedData } from '@/hooks/useUnifiedData'
import { usePermissions } from '@/lib/use-permissions'
import { 
  Calendar, 
  Download, 
  RefreshCw, 
  Filter, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye
} from 'lucide-react'
import type { ActionItem, FilterConfig } from '@/types/dashboard'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'booking' | 'task' | 'availability'
  status: string
  client?: string
  assignee?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  color: string
}

interface CalendarData {
  bookings: Array<{
    id: string
    clientName: string
    service: { name: string }
    scheduledAt: string
    duration: number
    status: string
    assignedTeamMember?: { name: string }
  }>
  tasks: Array<{
    id: string
    title: string
    dueAt: string | null
    status: string
    priority: string
    assignee?: { name: string }
  }>
  availability: Array<{
    id: string
    date: string
    startTime: string
    endTime: string
    teamMember: { name: string }
    available: boolean
  }>
}

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const { has } = usePermissions()

  // Fetch calendar data with real-time updates
  const { data: calendarData, error, isLoading, mutate } = useUnifiedData<CalendarData>({
    key: `calendar?date=${currentDate.toISOString().split('T')[0]}&view=${view}`,
    events: ['booking-updated', 'booking-created', 'task-updated', 'availability-updated'],
    revalidateOnEvents: true,
  })

  // Transform data into calendar events
  const events: CalendarEvent[] = useMemo(() => {
    if (!calendarData) return []

    const events: CalendarEvent[] = []

    // Add bookings
    if (selectedType === 'all' || selectedType === 'booking') {
      calendarData.bookings.forEach(booking => {
        if (selectedStatus === 'all' || selectedStatus === booking.status.toLowerCase()) {
          const start = new Date(booking.scheduledAt)
          const end = new Date(start.getTime() + (booking.duration * 60 * 1000))
          
          events.push({
            id: `booking-${booking.id}`,
            title: `${booking.clientName} - ${booking.service.name}`,
            start,
            end,
            type: 'booking',
            status: booking.status,
            client: booking.clientName,
            assignee: booking.assignedTeamMember?.name,
            color: getBookingColor(booking.status)
          })
        }
      })
    }

    // Add tasks with due dates
    if (selectedType === 'all' || selectedType === 'task') {
      calendarData.tasks.forEach(task => {
        if (task.dueAt && (selectedStatus === 'all' || selectedStatus === task.status.toLowerCase())) {
          const start = new Date(task.dueAt)
          
          events.push({
            id: `task-${task.id}`,
            title: `Task: ${task.title}`,
            start,
            end: start, // Tasks are point-in-time events
            type: 'task',
            status: task.status,
            assignee: task.assignee?.name,
            priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH',
            color: getTaskColor(task.priority, task.status)
          })
        }
      })
    }

    // Add availability slots
    if (selectedType === 'all' || selectedType === 'availability') {
      calendarData.availability.forEach(slot => {
        const date = new Date(slot.date)
        const [startHour, startMin] = slot.startTime.split(':').map(Number)
        const [endHour, endMin] = slot.endTime.split(':').map(Number)
        
        const start = new Date(date)
        start.setHours(startHour, startMin)
        
        const end = new Date(date)
        end.setHours(endHour, endMin)

        events.push({
          id: `availability-${slot.id}`,
          title: `${slot.teamMember.name} ${slot.available ? 'Available' : 'Busy'}`,
          start,
          end,
          type: 'availability',
          status: slot.available ? 'available' : 'busy',
          assignee: slot.teamMember.name,
          color: slot.available ? '#10b981' : '#f59e0b'
        })
      })
    }

    return events.sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [calendarData, selectedType, selectedStatus])

  const getBookingColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED': return '#10b981' // green
      case 'PENDING': return '#f59e0b' // amber
      case 'COMPLETED': return '#6366f1' // indigo
      case 'CANCELLED': return '#ef4444' // red
      default: return '#6b7280' // gray
    }
  }

  const getTaskColor = (priority: string, status: string): string => {
    if (status === 'COMPLETED') return '#10b981' // green
    
    switch (priority) {
      case 'HIGH': return '#ef4444' // red
      case 'MEDIUM': return '#f59e0b' // amber
      case 'LOW': return '#6366f1' // indigo
      default: return '#6b7280' // gray
    }
  }

  // Primary actions
  const primaryAction: ActionItem = {
    label: 'New Booking',
    icon: Plus,
    href: '/admin/bookings/new',
    variant: 'default'
  }

  const secondaryActions: ActionItem[] = [
    {
      label: 'Export Calendar',
      icon: Download,
      onClick: () => handleExport(),
      variant: 'outline'
    },
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: () => mutate(),
      variant: 'ghost'
    }
  ]

  // Filter configurations
  const filters: FilterConfig[] = [
    {
      key: 'view',
      label: 'View',
      type: 'select',
      options: [
        { label: 'Month View', value: 'month' },
        { label: 'Week View', value: 'week' },
        { label: 'Day View', value: 'day' }
      ],
      defaultValue: view
    },
    {
      key: 'types',
      label: 'Show',
      type: 'select',
      options: [
        { label: 'All Types', value: 'all' },
        { label: 'Bookings Only', value: 'booking' },
        { label: 'Tasks Only', value: 'task' },
        { label: 'Availability Only', value: 'availability' }
      ],
      defaultValue: 'all'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Status', value: 'all' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
        { label: 'In Progress', value: 'in_progress' }
      ],
      defaultValue: 'all'
    }
  ]

  const handleFilterChange = (key: string, value: any) => {
    switch (key) {
      case 'view':
        setView(value as 'month' | 'week' | 'day')
        break
      case 'types':
        setSelectedType(value as string)
        break
      case 'status':
        setSelectedStatus(value as string)
        break
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/export?entity=calendar&format=csv&date=${currentDate.toISOString()}&view=${view}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `calendar-${view}-${currentDate.toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (view) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
        break
    }
    
    setCurrentDate(newDate)
  }

  const formatDateRange = (): string => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric' 
    }
    
    switch (view) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', options)
      case 'week':
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      default:
        return ''
    }
  }

  return (
    <StandardPage
      title="Calendar Workspace"
      subtitle={`${formatDateRange()} • ${events.length} events`}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      filters={filters}
      onFilterChange={handleFilterChange}
      searchPlaceholder="Search events..."
      loading={isLoading}
      error={error ? 'Failed to load calendar data' : null}
    >
      {/* Calendar Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {formatDateRange()}
          </h2>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Today
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-700">Confirmed/Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          <span className="text-sm text-gray-700">Pending/Medium Priority</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm text-gray-700">High Priority/Urgent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
          <span className="text-sm text-gray-700">Completed/Low Priority</span>
        </div>
      </div>

      {/* Calendar Grid or List View */}
      <div className="bg-white rounded-lg border">
        {view === 'month' ? (
          <MonthView events={events} currentDate={currentDate} />
        ) : view === 'week' ? (
          <WeekView events={events} currentDate={currentDate} />
        ) : (
          <DayView events={events} currentDate={currentDate} />
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">
                {calendarData?.bookings.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Confirmed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {calendarData?.bookings.filter(b => b.status === 'CONFIRMED').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-amber-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Due Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">
                {calendarData?.tasks.filter(t => t.dueAt && t.status !== 'COMPLETED').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Team Available</p>
              <p className="text-2xl font-semibold text-gray-900">
                {calendarData?.availability.filter(a => a.available).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </StandardPage>
  )
}

// Calendar view components (simplified implementations)
function MonthView({ events, currentDate }: { events: CalendarEvent[], currentDate: Date }) {
  const getDaysInMonth = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const days = []
    
    // Add previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDay)
      date.setDate(date.getDate() - (i + 1))
      days.push({ date, isCurrentMonth: false })
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      days.push({ date, isCurrentMonth: true })
    }
    
    return days
  }

  const days = getDaysInMonth()
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200">
      {/* Weekday headers */}
      {weekdays.map(day => (
        <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {days.map((day, idx) => {
        const dayEvents = events.filter(event => 
          event.start.toDateString() === day.date.toDateString()
        )
        
        return (
          <div
            key={idx}
            className={`bg-white p-2 min-h-[100px] border-r border-b ${
              !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
            }`}
          >
            <div className="text-sm font-medium mb-1">
              {day.date.getDate()}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className="text-xs p-1 rounded truncate"
                  style={{ backgroundColor: event.color + '20', color: event.color }}
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WeekView({ events, currentDate }: { events: CalendarEvent[], currentDate: Date }) {
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }
    return days
  }

  const weekDays = getWeekDays()

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200">
      {weekDays.map(day => {
        const dayEvents = events.filter(event => 
          event.start.toDateString() === day.toDateString()
        )
        
        return (
          <div key={day.toISOString()} className="bg-white p-3 min-h-[200px]">
            <div className="text-sm font-medium mb-2">
              {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="space-y-1">
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className="text-xs p-2 rounded"
                  style={{ backgroundColor: event.color + '20', color: event.color }}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="text-xs opacity-75">
                    {event.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DayView({ events, currentDate }: { events: CalendarEvent[], currentDate: Date }) {
  const dayEvents = events.filter(event => 
    event.start.toDateString() === currentDate.toDateString()
  ).sort((a, b) => a.start.getTime() - b.start.getTime())

  return (
    <div className="p-4">
      <div className="space-y-3">
        {dayEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No events scheduled for this day
          </div>
        ) : (
          dayEvents.map(event => (
            <div
              key={event.id}
              className="flex items-center p-4 border rounded-lg"
              style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {event.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {event.end.getTime() !== event.start.getTime() && 
                      ` - ${event.end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                    }
                  </span>
                  {event.assignee && (
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {event.assignee}
                    </span>
                  )}
                  {event.priority && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      event.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      event.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.priority}
                    </span>
                  )}
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
