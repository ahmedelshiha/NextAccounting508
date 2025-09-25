"use client"

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, FileText, MapPin, Phone, Mail, AlertTriangle } from 'lucide-react'

export default function IntelligentActivityFeed({ data, thresholds, history, saveThresholds }: { data: any; thresholds?: any; history?: any; saveThresholds?: (t: any) => void }) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks' | 'deadlines'>('schedule')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredBookings = (data?.recentBookings || []).filter((booking: any) => {
    if (filterStatus === 'pending') return booking.status === 'pending'
    if (filterStatus === 'urgent') return booking.priority === 'high' || booking.priority === 'urgent'
    return true
  })

  const prioritizedTasks = ([...(data?.urgentTasks || [])] as any[]).sort((a, b) => {
    const priorityOrder: any = { critical: 4, high: 3, medium: 2, low: 1 }
    return (priorityOrder[b.priority as any] || 0) - (priorityOrder[a.priority as any] || 0)
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Center</CardTitle>
              <CardDescription>Real-time business operations</CardDescription>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {([
                { key: 'schedule', label: 'Schedule', count: (data?.recentBookings || []).length } as const,
                { key: 'tasks', label: 'Tasks', count: (data?.urgentTasks?.length ?? 0) } as const,
                { key: 'deadlines', label: 'Deadlines', count: (data?.upcomingDeadlines?.length ?? 0) } as const
              ] as const).map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs relative"
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs h-4 w-4 p-0">{tab.count}</Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
          {activeTab === 'schedule' && (
            <div className="flex items-center gap-2 mt-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border rounded px-2 py-1">
                <option value="all">All Bookings</option>
                <option value="pending">Pending Only</option>
                <option value="urgent">Urgent Only</option>
              </select>
            </div>
          )}
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          {activeTab === 'schedule' && (
            <div className="space-y-3">
              {filteredBookings.map((booking: any) => (
                <div key={booking.id} className={`p-4 rounded-lg border transition-all hover:shadow-sm ${booking.priority === 'high' || booking.priority === 'urgent' ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${booking.status === 'confirmed' ? 'bg-green-500' : booking.status === 'pending' ? 'bg-yellow-500' : booking.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      <h3 className="font-medium text-gray-900">{booking.clientName}</h3>
                      {booking.priority === 'high' && (<Badge variant="destructive" className="text-xs">High Priority</Badge>)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{booking.status}</Badge>
                      <span className="text-sm font-medium text-green-600">${booking.revenue}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>{new Date(booking.scheduledAt).toLocaleDateString()}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>{new Date(booking.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span>{booking.service}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span className="capitalize">{booking.location?.replace('_', ' ')}</span></div>
                  </div>

                  {booking.notes && (<div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700"><strong>Note:</strong> {booking.notes}</div>)}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-xs text-gray-500"><span>Assigned: {booking.assignedTo}</span><span>Duration: {booking.duration}min</span>{booking.isRecurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}</div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-xs"><Phone className="h-3 w-3 mr-1" />Call</Button>
                      <Button variant="ghost" size="sm" className="text-xs"><Mail className="h-3 w-3 mr-1" />Email</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {prioritizedTasks.map((task: any) => {
                const isOverdue = new Date(task.dueDate) < new Date()
                return (
                  <div key={task.id} className={`p-4 rounded-lg border transition-all ${isOverdue ? 'border-red-200 bg-red-50' : task.priority === 'critical' || task.priority === 'high' ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={task.priority === 'critical' ? 'destructive' : task.priority === 'high' ? 'default' : 'secondary'} className="text-xs">{task.priority}</Badge>
                        {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>

                    {task.description && (<p className="text-sm text-gray-600 mb-3">{task.description}</p>)}

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Progress</span><span className="font-medium">{task.completionPercentage}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full transition-all duration-300 ${task.completionPercentage > 75 ? 'bg-green-500' : task.completionPercentage > 50 ? 'bg-blue-500' : task.completionPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${task.completionPercentage}%` }} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3"><div>Due: {new Date(task.dueDate).toLocaleDateString()}</div><div>Est: {task.estimatedHours}h</div><div>Category: {task.category}</div><div>Assignee: {task.assignee}</div></div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-200"><Badge variant="outline" className="text-xs">{(task.status || '').replace('_', ' ')}</Badge><div className="flex gap-2"><Button variant="ghost" size="sm" className="text-xs">Update</Button><Button variant="ghost" size="sm" className="text-xs">Details</Button></div></div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'deadlines' && (
            <div className="space-y-3">
              { (data?.upcomingDeadlines || []).map((deadline: any) => {
                const daysUntilDue = Math.ceil((new Date(deadline.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                const isUrgent = daysUntilDue <= 3

                return (
                  <div key={deadline.id} className={`p-4 rounded-lg border transition-all ${isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between mb-3"><h3 className="font-medium text-gray-900">{deadline.title}</h3><div className="flex items-center gap-2"><Badge variant={deadline.importance === 'critical' ? 'destructive' : 'default'} className="text-xs">{deadline.importance}</Badge>{isUrgent && <AlertTriangle className="h-4 w-4 text-red-500" />}</div></div>
                    <p className="text-sm text-gray-600 mb-3">{deadline.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3"><div className="flex items-center gap-1"><Calendar className="h-3 w-3" /><span>Due: {new Date(deadline.dueDate).toLocaleDateString()}</span></div><div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span className={isUrgent ? 'text-red-600 font-medium' : ''}>{daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Overdue'}</span></div><div>Client: {deadline.clientName || 'Multiple'}</div><div>Assigned: {deadline.assignedTo}</div></div>
                    <div className="space-y-2"><div className="flex items-center justify-between text-xs"><span className="text-gray-500">Progress</span><span className="font-medium">{deadline.progress}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${deadline.progress}%` }} /></div></div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* EnhancedSystemHealth remains in the admin page file */}
    </div>
  )
}
