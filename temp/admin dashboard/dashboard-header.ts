// components/dashboard/header/DashboardHeader.tsx
import React from 'react'
import { Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { NotificationCenter } from './NotificationCenter'
import { HeaderControls } from './HeaderControls'
import { SystemStatusBadge } from './SystemStatusBadge'
import { useDashboardStore, useSystemHealth, useAutoRefresh } from '@/stores/dashboardStore'

export const DashboardHeader: React.FC = () => {
  const lastUpdated = useDashboardStore(state => state.lastUpdated)
  const autoRefresh = useAutoRefresh()
  const systemHealth = useSystemHealth()

  return (
    <div className="flex items-center justify-between mb-8 bg-white rounded-lg p-6 shadow-sm border">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <SystemStatusBadge status={systemHealth?.overall || 'healthy'} />
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
          <span>•</span>
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          
          {autoRefresh && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Live</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <HeaderControls />
        <NotificationCenter />
      </div>
    </div>
  )
}

// components/dashboard/header/SystemStatusBadge.tsx
interface SystemStatusBadgeProps {
  status: 'healthy' | 'warning' | 'critical'
}

export const SystemStatusBadge: React.FC<SystemStatusBadgeProps> = ({ status }) => {
  return (
    <Badge 
      variant={status === 'healthy' ? 'default' : 'destructive'} 
      className="text-xs"
    >
      System {status}
    </Badge>
  )
}

// components/dashboard/header/HeaderControls.tsx
import { RefreshCw, Download, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardStore } from '@/stores/dashboardStore'

export const HeaderControls: React.FC = () => {
  const { 
    autoRefresh, 
    selectedTimeframe, 
    toggleAutoRefresh, 
    setTimeframe, 
    refreshData 
  } = useDashboardStore()

  const handleExport = () => {
    const data = useDashboardStore.getState().data
    if (!data) return

    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        <label className="text-gray-600">View:</label>
        <select 
          value={selectedTimeframe} 
          onChange={(e) => setTimeframe(e.target.value as 'today' | 'week' | 'month')}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={toggleAutoRefresh}
      >
        {autoRefresh ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        Auto-refresh
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2" 
        onClick={refreshData}
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2" 
        onClick={handleExport}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
    </>
  )
}

// components/dashboard/header/NotificationCenter.tsx
import { useState } from 'react'
import { Bell, ArrowRight, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications, useDashboardStore } from '@/stores/dashboardStore'

export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, showNotifications } = useNotifications()
  const { toggleNotifications, markAllAsRead, markAsRead } = useDashboardStore()
  
  const urgentNotifications = notifications.filter(n => n.type === 'urgent' && !n.read)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent': return AlertTriangle
      case 'error': return AlertCircle  
      case 'warning': return AlertCircle
      case 'success': return CheckCircle
      default: return Bell
    }
  }

  return (
    <div className="relative">
      <Button 
        variant={urgentNotifications.length > 0 ? "destructive" : "outline"}
        size="sm" 
        className="gap-2 relative"
        onClick={toggleNotifications}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant={urgentNotifications.length > 0 ? "secondary" : "destructive"} 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
      
      {showNotifications && (
        <Card className="absolute right-0 top-12 w-96 z-50 shadow-xl max-h-96 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notifications</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs" 
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {notifications.slice(0, 10).map((notification) => {
                const IconComponent = getNotificationIcon(notification.type)
                return (
                  <div 
                    key={notification.id} 
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        notification.type === 'urgent' ? 'text-red-500' :
                        notification.type === 'error' ? 'text-red-500' :
                        notification.type === 'warning' ? 'text-yellow-500' :
                        notification.type === 'success' ? 'text-green-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {notification.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 leading-tight mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                          {notification.actionRequired && notification.actionUrl && (
                            <Button variant="ghost" size="sm" className="text-xs p-1 h-auto">
                              Take Action <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="p-3 border-t bg-gray-50">
              <Button variant="ghost" size="sm" className="w-full text-sm">
                View All Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}