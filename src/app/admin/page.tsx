'use client'

"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  Calendar, 
  Users, 
  FileText, 
  Mail, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/lib/use-permissions'

interface DashboardStats {
  bookings: {
    total: number
    pending: number
    confirmed: number
    completed: number
    today: number
    thisMonth?: number
    lastMonth?: number
  }
  users: {
    total: number
    clients: number
    staff: number
    newThisMonth: number
    registrationTrends?: Array<{ month: string; count: number }>
  }
  posts: {
    total: number
    published: number
    drafts: number
    publishingTrends?: Array<{ month: string; count: number }>
  }
  newsletter: {
    total: number
    subscribed: number
    newThisMonth: number
  }
  revenue: {
    thisMonth: number
    lastMonth: number
    growth: number
  }
}

interface RecentBooking {
  id: string
  clientName: string
  service: { name: string }
  scheduledAt: string
  status: string
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const perms = usePermissions()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch dashboard statistics
        const statsPromises = await Promise.allSettled([
          apiFetch('/api/admin/stats/bookings').then(res => res.ok ? res.json() : Promise.reject(res)),
          apiFetch('/api/admin/stats/users').then(res => res.ok ? res.json() : Promise.reject(res)),
          apiFetch('/api/admin/stats/posts').then(res => res.ok ? res.json() : Promise.reject(res)),
          apiFetch('/api/newsletter').then(res => res.ok ? res.json() : Promise.reject(res)),
          apiFetch('/api/db-check').then(res => res.ok ? res.json() : Promise.reject(res)),
          apiFetch('/api/admin/analytics').then(res => res.ok ? res.json() : Promise.reject(res)),
        ])

        const bookingsData = statsPromises[0].status === 'fulfilled' ? statsPromises[0].value : { total: 0, pending: 0, confirmed: 0, completed: 0, today: 0 }
        const usersData = statsPromises[1].status === 'fulfilled' ? statsPromises[1].value : { total: 0, clients: 0, staff: 0, newThisMonth: 0 }
        const postsData = statsPromises[2].status === 'fulfilled' ? statsPromises[2].value : { total: 0, published: 0, drafts: 0 }
        const newsletterData = statsPromises[3].status === 'fulfilled' ? statsPromises[3].value : { total: 0, active: 0 }
        const dbCheckOk = statsPromises[4].status === 'fulfilled'

        setDbHealthy(dbCheckOk)

        const analytics = statsPromises[5].status === 'fulfilled' ? (statsPromises[5] as PromiseFulfilledResult<any>).value : null

        setStats({
          bookings: bookingsData,
          users: usersData,
          posts: postsData,
          newsletter: {
            total: newsletterData.total || 0,
            subscribed: newsletterData.subscribed || 0,
            newThisMonth: 0
          },
          revenue: {
            thisMonth: Number(bookingsData?.revenue?.thisMonth ?? 0),
            lastMonth: Number(bookingsData?.revenue?.lastMonth ?? 0),
            growth: Number(bookingsData?.revenue?.growth ?? bookingsData?.growth ?? 0),
          }
        })

        ;(window as any).__adminAnalytics__ = analytics

        // Fetch recent bookings
        const recentBookingsRes = await apiFetch('/api/bookings?limit=5')
        if (recentBookingsRes.ok) {
          const recentBookingsData = await recentBookingsRes.json()
          setRecentBookings(recentBookingsData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchDashboardData()
    }
  }, [session])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session?.user?.name}! Here&apos;s what&apos;s happening with your business.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.bookings.total || 0}</div>
              <p className="text-xs text-gray-600">
                {stats?.bookings.today || 0} scheduled today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
              <p className="text-xs text-gray-600">
                {stats?.users.newThisMonth || 0} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.posts.published || 0}</div>
              <p className="text-xs text-gray-600">
                {stats?.posts.drafts || 0} drafts pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Newsletter</CardTitle>
              <Mail className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.newsletter.subscribed || 0}</div>
              <p className="text-xs text-gray-600">
                Active subscribers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(stats?.revenue.thisMonth || 0)}
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                <span className="text-green-600 font-medium">
                  +{stats?.revenue.growth || 0}%
                </span>
                <span className="text-gray-600 ml-1">from last month</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Last month: {formatCurrency(stats?.revenue.lastMonth || 0)}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center">
                  <Link href="/admin/bookings">
                    <Calendar className="h-6 w-6 mb-2" />
                    <span className="text-sm">Manage Bookings</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center">
                  <Link href="/admin/users">
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-sm">Manage Users</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center">
                  <Link href="/admin/posts">
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-sm">Manage Posts</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center">
                  <Link href="/admin/services">
                    <Settings className="h-6 w-6 mb-2" />
                    <span className="text-sm">Manage Services</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center">
                  <Link href="/admin/newsletter">
                    <Mail className="h-6 w-6 mb-2" />
                    <span className="text-sm">Newsletter</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center">
                  <Link href="/admin/settings">
                    <Settings className="h-6 w-6 mb-2" />
                    <span className="text-sm">Settings</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trends */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Trends (last 6 months)</CardTitle>
            <CardDescription>Users and content publishing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-800 mb-2">User Registrations</div>
                <div className="h-24 flex items-end gap-2">
                  {(stats?.users.registrationTrends || []).map((p) => {
                    const max = Math.max(...(stats?.users.registrationTrends || []).map(x => x.count), 1)
                    const height = Math.max(4, Math.round((p.count / max) * 96))
                    return <div key={p.month} className="bg-blue-500/70 rounded" style={{ height, width: 12 }} title={`${p.month}: ${p.count}`} />
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 mb-2">Posts Published</div>
                <div className="h-24 flex items-end gap-2">
                  {(stats?.posts.publishingTrends || []).map((p) => {
                    const max = Math.max(...(stats?.posts.publishingTrends || []).map(x => x.count), 1)
                    const height = Math.max(4, Math.round((p.count / max) * 96))
                    return <div key={p.month} className="bg-purple-500/70 rounded" style={{ height, width: 12 }} title={`${p.month}: ${p.count}`} />
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Analytics */}
        {perms.canViewAnalytics && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Advanced Analytics</CardTitle>
            <CardDescription>Bookings and revenue insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="text-sm font-medium text-gray-800 mb-2">Daily Bookings (14d)</div>
                <div className="h-24 flex items-end gap-1">
                  {((window as any).__adminAnalytics__?.dailyBookings || []).map((p: any, i: number) => {
                    const max = Math.max(...((window as any).__adminAnalytics__?.dailyBookings || []).map((x: any) => x.count), 1)
                    const height = Math.max(4, Math.round((p.count / max) * 96))
                    return <div key={p.date || i} className="bg-gray-400 rounded" style={{ height, width: 8 }} title={`${p.date || i}: ${p.count}`} />
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 mb-2">Avg Lead Time</div>
                <div className="text-3xl font-bold text-gray-900">{((window as any).__adminAnalytics__?.avgLeadTimeDays || 0).toFixed(1)}<span className="text-sm text-gray-600 ml-1">days</span></div>
              </div>
            </div>
            <div className="mt-6">
              <div className="text-sm font-medium text-gray-800 mb-2">Revenue by Service</div>
              <div className="space-y-2">
                {((window as any).__adminAnalytics__?.revenueByService || []).map((r: any) => {
                  const max = Math.max(...((window as any).__adminAnalytics__?.revenueByService || []).map((x: any) => x.amount), 1)
                  const width = Math.max(4, Math.round((r.amount / max) * 100))
                  return (
                    <div key={r.service} className="flex items-center gap-2">
                      <div className="w-40 text-sm text-gray-700 truncate">{r.service}</div>
                      <div className="flex-1 bg-gray-100 rounded h-3">
                        <div className="h-3 bg-green-500/70 rounded" style={{ width: `${width}%` }} />
                      </div>
                      <div className="w-24 text-right text-sm text-gray-600">{formatCurrency(r.amount)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>
                Latest appointment bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {booking.clientName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {booking.service.name}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(booking.scheduledAt)}
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/bookings">
                      View All Bookings
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent bookings</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current system health and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {(dbHealthy ? <CheckCircle className="h-5 w-5 text-green-500 mr-2" /> : <AlertCircle className="h-5 w-5 text-red-500 mr-2" />)}
                    <span className="text-sm">Database Connection</span>
                  </div>
                  <Badge className={dbHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{dbHealthy ? 'Healthy' : 'Unavailable'}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {process.env.SENDGRID_API_KEY ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    )}
                    <span className="text-sm">Email Service</span>
                  </div>
                  <Badge className={process.env.SENDGRID_API_KEY ? 
                    "bg-green-100 text-green-800" : 
                    "bg-yellow-100 text-yellow-800"
                  }>
                    {process.env.SENDGRID_API_KEY ? 'Configured' : 'Mock Mode'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Authentication</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">API Endpoints</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>

                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/admin/settings">
                    View System Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
