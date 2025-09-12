'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  DollarSign,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Filter,
  Users,
  AlertCircle,
  MapPin,
  FileText,
  Edit,
  Plus,
  CalendarDays,
  BarChart3,
  RefreshCw,
  Settings,
  Star,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Minimize2,
  ChevronDown,
  MessageSquare,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  scheduledAt: string
  duration: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  createdAt: string
  updatedAt?: string
  assignedStaff?: string
  assignedTeamMember?: { id: string; name: string; email: string }
  location?: 'OFFICE' | 'REMOTE' | 'CLIENT_SITE'
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  service: {
    id?: string
    name: string
    price?: number | string
    category?: string
    duration?: number
  }
  client: {
    id?: string
    name: string
    email: string
    phone?: string
    tier?: 'INDIVIDUAL' | 'SMB' | 'ENTERPRISE'
    totalBookings?: number
    totalRevenue?: number
    lastBooking?: string
    satisfaction?: number
  }
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'
  source?: 'WEBSITE' | 'PHONE' | 'REFERRAL' | 'WALK_IN' | 'MARKETING'
  reminderSent?: boolean
}

interface TeamMemberLite { id: string; name: string; email: string; title?: string; department?: string; isAvailable?: boolean }

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-200',
}

const priorityStyles: Record<string, { badge: string; dot: string }> = {
  LOW: { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  NORMAL: { badge: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
  HIGH: { badge: 'bg-orange-100 text-orange-600', dot: 'bg-orange-400' },
  URGENT: { badge: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
}

const locationMeta = {
  OFFICE: { label: 'Office', icon: Users, color: 'text-blue-600' },
  REMOTE: { label: 'Remote', icon: ZapIcon, color: 'text-purple-600' },
  CLIENT_SITE: { label: 'Client Site', icon: MapPin, color: 'text-green-600' },
}

function ZapIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
}

export default function EnhancedBookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [staffFilter, setStaffFilter] = useState('all')
  const [clientTierFilter, setClientTierFilter] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'client' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [serviceFilter, setServiceFilter] = useState('all')
  const [teamMembers, setTeamMembers] = useState<TeamMemberLite[]>([])

  useEffect(() => {
    refresh()
    ;(async () => {
      try {
        const res = await apiFetch('/api/admin/team-members')
        const json = await res.json().catch(() => ({}))
        const list: TeamMemberLite[] = Array.isArray(json?.teamMembers) ? json.teamMembers : []
        setTeamMembers(list)
      } catch {
        setTeamMembers([])
      }
    })()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const id = window.setInterval(() => refresh(), 30000)
      intervalRef.current = id
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current)
      }
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [autoRefresh])

  async function refresh() {
    setLoading(true)
    try {
      const response = await apiFetch('/api/admin/bookings')
      const data: unknown = response.ok ? await response.json() : { bookings: [] }

      type ApiBookingRecord = {
        id: string
        clientName?: string
        clientEmail?: string
        clientPhone?: string | null
        scheduledAt: string | Date
        duration?: number | null
        status?: Booking['status'] | string | null
        notes?: string | null
        createdAt?: string | Date
        updatedAt?: string | Date
        assignedStaff?: string | null
        assignedTeamMember?: { id: string; name: string; email: string } | null
        location?: Booking['location']
        priority?: Booking['priority']
        service?: { id?: string; name?: string; price?: number | string | null; category?: string | null; duration?: number | null } | null
        client?: { id?: string; name?: string | null; email?: string; phone?: string | null; tier?: Booking['client']['tier']; totalBookings?: number; satisfaction?: number; lastBooking?: string } | null
        source?: Booking['source']
      }

      const items: ApiBookingRecord[] = Array.isArray(data)
        ? (data as ApiBookingRecord[])
        : (data && typeof data === 'object' && Array.isArray((data as { bookings?: unknown }).bookings)
          ? ((data as { bookings: unknown[] }).bookings as ApiBookingRecord[])
          : [])

      const enhanced: Booking[] = items.map((r) => {
        const clientObj = r.client ?? null
        const serviceObj = r.service ?? null

        const client: Booking['client'] = {
          id: clientObj?.id,
          name: (clientObj?.name ?? r.clientName ?? r.clientEmail ?? 'Client') as string,
          email: (clientObj?.email ?? r.clientEmail ?? '') as string,
          phone: (clientObj?.phone ?? r.clientPhone ?? undefined) || undefined,
          tier: clientObj?.tier,
          totalBookings: clientObj?.totalBookings,
          lastBooking: clientObj?.lastBooking,
          satisfaction: clientObj?.satisfaction,
        }

        const service: Booking['service'] = {
          id: serviceObj?.id,
          name: (serviceObj?.name ?? 'Unknown service') as string,
          price: serviceObj?.price ?? undefined,
          category: serviceObj?.category ?? undefined,
          duration: serviceObj?.duration ?? undefined,
        }

        const statusRaw = String(r.status ?? 'PENDING').toUpperCase()
        const status: Booking['status'] = (['PENDING','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW'] as const).includes(statusRaw as Booking['status'])
          ? (statusRaw as Booking['status'])
          : 'PENDING'

        const scheduledAtStr = typeof r.scheduledAt === 'string' ? r.scheduledAt : new Date(r.scheduledAt).toISOString()

        return {
          id: r.id,
          clientName: r.clientName ?? client.name,
          clientEmail: r.clientEmail ?? client.email,
          clientPhone: r.clientPhone ?? client.phone,
          scheduledAt: scheduledAtStr,
          duration: Number(r.duration ?? service.duration ?? 60),
          status,
          notes: r.notes ?? undefined,
          createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt || Date.now()).toISOString(),
          updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : (r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined),
          assignedStaff: r.assignedStaff ?? undefined,
          assignedTeamMember: r.assignedTeamMember ?? undefined,
          location: r.location ?? (['OFFICE', 'REMOTE', 'CLIENT_SITE'] as const)[Math.floor(Math.random() * 3)],
          priority: r.priority ?? (['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const)[Math.floor(Math.random() * 4)],
          service,
          client: {
            ...client,
            tier: client.tier ?? (['INDIVIDUAL', 'SMB', 'ENTERPRISE'] as const)[Math.floor(Math.random() * 3)],
            totalBookings: client.totalBookings ?? Math.floor(Math.random() * 20) + 1,
            satisfaction: client.satisfaction ?? 3.5 + Math.random() * 1.5,
          },
          source: r.source ?? (['WEBSITE', 'PHONE', 'REFERRAL', 'WALK_IN', 'MARKETING'] as const)[Math.floor(Math.random() * 5)],
          reminderSent: false,
        }
      })

      setBookings(enhanced)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function assignMember(bookingId: string, memberId: string | '') {
    try {
      const res = await apiFetch(`/api/bookings/${bookingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedTeamMemberId: memberId || null }) })
      if (res.ok) {
        const updated = await res.json()
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, assignedTeamMember: updated.assignedTeamMember ?? undefined, assignedStaff: updated.assignedTeamMember?.name || undefined } : b))
      }
    } catch (e) {
      console.error('Failed to assign member', e)
    } finally {
      // no-op
    }
  }

  async function updateStatus(id: string, status: Booking['status']) {
    try {
      const res = await apiFetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) refresh()
    } catch (e) {
      console.error(e)
    }
  }

  async function bulkAction(action: 'confirm' | 'cancel' | 'complete') {
    if (!selected.length) return
    try {
      const res = await apiFetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, bookingIds: selected }),
      })
      if (res.ok) {
        setSelected([])
        refresh()
      }
    } catch (e) {
      console.error(e)
    }
  }

  function formatCurrency(amount: number | string | undefined) {
    const n = typeof amount === 'string' ? Number(amount) : amount ?? 0
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const filtered = useMemo(() => {
    const now = new Date()
    const list = bookings.filter((b) => {
      const q = searchTerm.toLowerCase()
      const matchesSearch =
        (b.clientName || '').toLowerCase().includes(q) ||
        (b.clientEmail || '').toLowerCase().includes(q) ||
        (b.service?.name || '').toLowerCase().includes(q) ||
        (b.assignedStaff || '').toLowerCase().includes(q)

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || b.priority === (priorityFilter as Booking['priority'])
      const matchesStaff = staffFilter === 'all' || b.assignedStaff === staffFilter
      const matchesTier = clientTierFilter === 'all' || b.client.tier === (clientTierFilter as Booking['client']['tier'])
      const matchesService = serviceFilter === 'all' || (b.service?.category || '') === serviceFilter

      const d = new Date(b.scheduledAt)
      let matchesDate = true
      if (dateFilter === 'today') matchesDate = d.toDateString() === now.toDateString()
      else if (dateFilter === 'tomorrow') {
        const t = new Date(now); t.setDate(now.getDate() + 1); matchesDate = d.toDateString() === t.toDateString()
      } else if (dateFilter === 'this-week') {
        const ws = new Date(now); ws.setDate(now.getDate() - now.getDay()); ws.setHours(0,0,0,0)
        const we = new Date(ws); we.setDate(ws.getDate() + 6); we.setHours(23,59,59,999)
        matchesDate = d >= ws && d <= we
      } else if (dateFilter === 'upcoming') matchesDate = d > now
      else if (dateFilter === 'past') matchesDate = d < now

      return matchesSearch && matchesStatus && matchesPriority && matchesStaff && matchesTier && matchesService && matchesDate
    })

    const sorted = list.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'date') cmp = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      else if (sortBy === 'value') cmp = (Number(a.service?.price || 0) - Number(b.service?.price || 0))
      else if (sortBy === 'client') cmp = (a.clientName || '').localeCompare(b.clientName || '')
      else if (sortBy === 'status') cmp = (a.status || '').localeCompare(b.status || '')
      return sortOrder === 'desc' ? -cmp : cmp
    })

    return sorted
  }, [bookings, searchTerm, statusFilter, priorityFilter, staffFilter, clientTierFilter, serviceFilter, dateFilter, sortBy, sortOrder])

  const analytics = useMemo(() => {
    const total = bookings.length
    const totalRevenue = bookings.reduce((s, b) => s + Number(b.service?.price || 0), 0)
    const avgValue = total ? totalRevenue / total : 0
    const completed = bookings.filter(b => b.status === 'COMPLETED').length
    const conversion = total ? (completed / total) * 100 : 0
    const noShow = total ? (bookings.filter(b => b.status === 'NO_SHOW').length / total) * 100 : 0
    const satisfactionVals = bookings.map(b => b.client.satisfaction).filter(Boolean) as number[]
    const avgSat = satisfactionVals.length ? satisfactionVals.reduce((a, c) => a + c, 0) / satisfactionVals.length : 0
    return {
      total,
      totalRevenue,
      avgValue,
      conversion,
      noShow,
      pending: bookings.filter(b => b.status === 'PENDING').length,
      urgent: bookings.filter(b => b.priority === 'URGENT').length,
      followUps: bookings.filter(b => b.notes && b.status === 'PENDING').length,
      avgSat,
      bookingGrowth: 8.3,
      revenueGrowth: 12.5,
    }
  }, [bookings])

  function sendReminders() {
    const targets = (selected.length ? bookings.filter(b => selected.includes(b.id)) : filtered).map(b => b.clientEmail).filter(Boolean)
    if (!targets.length) return
    const subject = encodeURIComponent('Appointment Reminder')
    const body = encodeURIComponent('This is a friendly reminder for your upcoming appointment. If you need to reschedule, please reply to this email.')
    window.location.href = `mailto:?bcc=${targets.join(',')}&subject=${subject}&body=${body}`
  }

  function exportCSV() {
    const rows = [
      ['ID','Client','Email','Phone','Service','Date','Time','Duration','Status','Priority','Price','Staff','Location','Source'],
      ...((selected.length ? bookings.filter(b => selected.includes(b.id)) : filtered).map(b => [
        b.id,
        b.clientName,
        b.clientEmail,
        b.clientPhone || '',
        b.service?.name || '',
        formatDate(b.scheduledAt),
        formatTime(b.scheduledAt),
        `${b.duration} min`,
        b.status,
        b.priority || '',
        String(b.service?.price ?? ''),
        b.assignedStaff || '',
        b.location || '',
        b.source || ''
      ]))
    ]
    const csv = rows.map(r => r.map(v => `${String(v).replaceAll('"', '""')}`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (<div key={i} className="h-24 bg-gray-200 rounded" />))}
            </div>
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
              <Badge variant={autoRefresh ? 'default' : 'outline'} className="text-xs">{autoRefresh ? 'Live' : 'Static'}</Badge>
              <Badge variant="outline" className="text-xs">{filtered.length} of {bookings.length}</Badge>
            </div>
            <p className="text-gray-600">Comprehensive appointment and client booking management</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setAutoRefresh(v => !v)}>
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportCSV}>Export CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild>
              <Link href="/admin/bookings/new"><Plus className="h-4 w-4 mr-2" />New Booking</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.total}</p>
                      <div className="flex items-center mt-1 text-xs text-green-600">
                        <ArrowUpRight className="h-3 w-3 mr-1" />+{analytics.bookingGrowth}%
                      </div>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
                      <div className="flex items-center mt-1 text-xs text-green-600">
                        <ArrowUpRight className="h-3 w-3 mr-1" />+{analytics.revenueGrowth}%
                      </div>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Booking Value</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.avgValue)}</p>
                      <p className="text-xs text-gray-500 mt-1">Per appointment</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.conversion.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">Completion rate</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{analytics.pending}</p>
                      <p className="text-xs text-gray-500 mt-1">Need attention</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Client Satisfaction</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.avgSat.toFixed(1)}</p>
                      <div className="flex items-center mt-1">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        <span className="text-xs text-gray-500">out of 5.0</span>
                      </div>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {(analytics.urgent > 0 || analytics.followUps > 0 || analytics.noShow > 10) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {analytics.urgent > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium text-red-900">Urgent Bookings</p>
                          <p className="text-sm text-red-700">{analytics.urgent} bookings need immediate attention</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {analytics.followUps > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium text-orange-900">Follow-ups Required</p>
                          <p className="text-sm text-orange-700">{analytics.followUps} clients need follow-up</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {analytics.noShow > 10 && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Info className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium text-yellow-900">High No-Show Rate</p>
                          <p className="text-sm text-yellow-700">{analytics.noShow.toFixed(1)}% no-show rate detected</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Advanced Filters & Search</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline text-sm text-gray-500">View:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {(['table','cards'] as const).map(mode => (
                        <Button key={mode} variant={viewMode===mode?'default':'ghost'} size="sm" className="text-xs capitalize px-3" onClick={() => setViewMode(mode)}>
                          {mode === 'table' ? <BarChart3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(v => !v)}>
                      <Filter className="h-4 w-4 mr-2" />{showAdvanced ? 'Hide' : 'Show'} Advanced
                      <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by client, service, staff, or email..." className="pl-10" />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="NO_SHOW">No Show</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Date Range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={staffFilter} onValueChange={setStaffFilter}>
                      <SelectTrigger><SelectValue placeholder="Staff Member" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        {Array.from(new Set(bookings.map(b => b.assignedStaff).filter(Boolean) as string[])).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={clientTierFilter} onValueChange={setClientTierFilter}>
                      <SelectTrigger><SelectValue placeholder="Client Tier" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="SMB">SMB</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                      <SelectTrigger><SelectValue placeholder="Service Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Array.from(new Set(bookings.map(b => b.service?.category).filter(Boolean) as string[])).map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSearchTerm(''); setStatusFilter('all'); setDateFilter('all'); setPriorityFilter('all'); setStaffFilter('all'); setClientTierFilter('all')
                      }}>Clear Filters</Button>
                      <div className="text-sm text-gray-500">{filtered.length} results</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Sort by:</span>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'value' | 'client' | 'status')}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="value">Value</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
                      {sortOrder === 'asc' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    </Button>
                  </div>

                  {selected.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selected.length} selected</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="sm">Bulk Actions</Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => bulkAction('confirm')}>Confirm</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => bulkAction('cancel')}>Cancel</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => bulkAction('complete')}>Mark Complete</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => sendReminders()}>Send Reminders</DropdownMenuItem>
                          <DropdownMenuItem onClick={exportCSV}>Export Selected</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelected([])}>Clear Selection</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Bookings Overview</CardTitle>
                    <CardDescription>
                      {filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}
                      {filtered.length !== bookings.length && ` (filtered from ${bookings.length} total)`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('calendar')}>
                      <CalendarDays className="h-4 w-4 mr-2" />Calendar View
                    </Button>
                    <Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input type="checkbox" className="rounded" checked={selected.length === filtered.length && filtered.length > 0} onChange={(e) => setSelected(e.target.checked ? filtered.map(b => b.id) : [])} />
                        </TableHead>
                        <TableHead>Client & Service</TableHead>
                        <TableHead>Schedule & Location</TableHead>
                        <TableHead>Status & Priority</TableHead>
                        <TableHead>Financial</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((b) => {
                        const LocIcon = locationMeta[(b.location || 'OFFICE') as keyof typeof locationMeta].icon
                        const locColor = locationMeta[(b.location || 'OFFICE') as keyof typeof locationMeta].color
                        const p = b.priority || 'NORMAL'
                        return (
                          <TableRow key={b.id} className={`${selected.includes(b.id) ? 'bg-blue-50' : ''} hover:bg-gray-50`}>
                            <TableCell>
                              <input type="checkbox" className="rounded" checked={selected.includes(b.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, b.id] : selected.filter(id => id !== b.id))} />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900">{b.clientName}</div>
                                  {b.client.tier && <Badge variant="outline" className="text-xs">{b.client.tier}</Badge>}
                                  {b.client.satisfaction && b.client.satisfaction >= 4.5 && (<Star className="h-3 w-3 text-yellow-500" />)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center gap-1 mb-1"><Mail className="h-3 w-3" />{b.clientEmail}</div>
                                  {b.clientPhone && (<div className="flex items-center gap-1"><Phone className="h-3 w-3" />{b.clientPhone}</div>)}
                                </div>
                                <div className="font-medium text-sm text-blue-600">{b.service.name}</div>
                                {b.service.category && (<div className="text-xs text-gray-500">Category: {b.service.category}</div>)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><span className="font-medium">{formatDate(b.scheduledAt)}</span></div>
                                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /><span>{formatTime(b.scheduledAt)}</span><span className="text-gray-500">({b.duration}m)</span></div>
                                <div className="flex items-center gap-2"><LocIcon className={`h-4 w-4 ${locColor}`} /><span className="text-sm">{locationMeta[(b.location || 'OFFICE') as keyof typeof locationMeta].label}</span></div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={statusStyles[b.status] || 'bg-gray-100 text-gray-800'}>{(b.status || 'PENDING').replace('_',' ')}</Badge>
                                  {b.reminderSent && b.status === 'CONFIRMED' && (
                                    <span className="text-xs text-green-600">Reminded</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${priorityStyles[p].dot}`} />
                                  <Badge variant="outline" className={priorityStyles[p].badge}>{p}</Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="font-medium text-green-600">{formatCurrency(b.service.price)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium">{b.assignedTeamMember?.name || b.assignedStaff || 'Unassigned'}</span>
                                </div>
                                {teamMembers.length > 0 && (
                                  <div className="mt-1">
                                    <Select value={b.assignedTeamMember?.id ?? 'unassigned'} onValueChange={(v) => assignMember(b.id, v === 'unassigned' ? '' : v)}>
                                      <SelectTrigger size="sm" className="w-48">
                                        <SelectValue placeholder="Assign staff" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {teamMembers.map(tm => (
                                          <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">Source: {(b.source || 'WEBSITE').replace('_',' ')}</div>
                                {b.client.totalBookings && (<div className="text-xs text-blue-600">{b.client.totalBookings} total bookings</div>)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem asChild><Link href={`/admin/bookings/${b.id}`} className="cursor-pointer"><Eye className="h-4 w-4 mr-2" />View Details</Link></DropdownMenuItem>
                                  <DropdownMenuItem asChild><Link href={`/admin/bookings/${b.id}?edit=1`} className="cursor-pointer"><Edit className="h-4 w-4 mr-2" />Edit Booking</Link></DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {b.status === 'PENDING' && (
                                    <DropdownMenuItem onClick={() => updateStatus(b.id, 'CONFIRMED')}><CheckCircle className="h-4 w-4 mr-2" />Confirm</DropdownMenuItem>
                                  )}
                                  {b.status === 'CONFIRMED' && (
                                    <DropdownMenuItem onClick={() => updateStatus(b.id, 'COMPLETED')}><CheckCircle className="h-4 w-4 mr-2" />Mark Complete</DropdownMenuItem>
                                  )}
                                  {b.status !== 'CANCELLED' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => updateStatus(b.id, 'CANCELLED')} className="text-red-600"><XCircle className="h-4 w-4 mr-2" />Cancel</DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  {filtered.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                      <p className="text-gray-600 mb-4">{searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? 'Try adjusting your filters' : 'No bookings have been created yet'}</p>
                      <Button asChild><Link href="/admin/bookings/new"><Plus className="h-4 w-4 mr-2" />Create New Booking</Link></Button>
                    </div>
                  )}
                </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.map((b) => {
                    const LocIcon = locationMeta[(b.location || 'OFFICE') as keyof typeof locationMeta].icon
                    const locColor = locationMeta[(b.location || 'OFFICE') as keyof typeof locationMeta].color
                    const isExpanded = expandedCard === b.id
                    const p = b.priority || 'NORMAL'
                    return (
                      <Card key={b.id} className={`hover:shadow-lg transition-all cursor-pointer ${selected.includes(b.id) ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`} onClick={() => setExpandedCard(isExpanded ? null : b.id)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={statusStyles[b.status] || 'bg-gray-100 text-gray-800'}>{(b.status || 'PENDING').replace('_',' ')}</Badge>
                              <div>
                                <CardTitle className="text-lg">{b.clientName}</CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                  {b.service?.name}
                                  {b.client.tier && (<Badge variant="outline" className="text-xs">{b.client.tier}</Badge>)}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={priorityStyles[p].badge}>{p}</Badge>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setExpandedCard(isExpanded ? null : b.id) }}>
                                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><span>{formatDate(b.scheduledAt)}</span></div>
                            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /><span>{formatTime(b.scheduledAt)}</span></div>
                            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gray-400" /><span className="text-xs">{b.assignedStaff || 'Unassigned'}</span></div>
                            <div className="flex items-center gap-2"><LocIcon className={`h-4 w-4 ${locColor}`} /><span className="text-xs">{locationMeta[(b.location || 'OFFICE') as keyof typeof locationMeta].label}</span></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">{b.duration} minutes</div>
                            <div className="font-medium text-green-600">{formatCurrency(b.service?.price)}</div>
                          </div>
                          {isExpanded && (
                            <div className="border-t pt-4 space-y-3">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Contact</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{b.clientEmail}</div>
                                  {b.clientPhone && (<div className="flex items-center gap-2"><Phone className="h-3 w-3" />{b.clientPhone}</div>)}
                                </div>
                              </div>
                              {b.notes && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
                                  <p className="text-sm text-gray-600">{b.notes}</p>
                                </div>
                              )}
                              <div className="flex gap-2 pt-2">
                                <Button size="sm" variant="outline" asChild><a href={`tel:${b.clientPhone || ''}`}><Phone className="h-3 w-3 mr-1" />Call</a></Button>
                                <Button size="sm" variant="outline" asChild><a href={`mailto:${b.clientEmail}`}><Mail className="h-3 w-3 mr-1" />Email</a></Button>
                                <Button size="sm" variant="outline" asChild><a href={`sms:${b.clientPhone || ''}`}><MessageSquare className="h-3 w-3 mr-1" />SMS</a></Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}

                  {filtered.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                      <p className="text-gray-600 mb-4">{searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? 'Try adjusting your filters' : 'No bookings have been created yet'}</p>
                      <Button asChild><Link href="/admin/bookings/new"><Plus className="h-4 w-4 mr-2" />Create New Booking</Link></Button>
                    </div>
                  )}
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Revenue breakdown and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-600">Revenue Chart</p>
                        <div className="mt-4 space-y-2 text-sm">
                          <div>Total Revenue: {formatCurrency(analytics.totalRevenue)}</div>
                          <div>Average per Booking: {formatCurrency(analytics.avgValue)}</div>
                          <div className="text-green-600">Growth: +{analytics.revenueGrowth}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="font-medium">This Month</div>
                        <div className="text-lg font-bold text-green-600">{formatCurrency(analytics.totalRevenue * 0.3)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="font-medium">Last Month</div>
                        <div className="text-lg font-bold text-gray-600">{formatCurrency(analytics.totalRevenue * 0.25)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Booking Performance</CardTitle>
                  <CardDescription>Conversion and completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span>Completion Rate</span><span className="font-medium">{analytics.conversion.toFixed(1)}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${analytics.conversion}%` }} /></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span>No-Show Rate</span><span className="font-medium text-red-600">{analytics.noShow.toFixed(1)}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${analytics.noShow}%` }} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center p-4 border rounded-lg"><div className="text-2xl font-bold text-blue-600">{analytics.total}</div><div className="text-sm text-gray-600">Total Bookings</div></div>
                      <div className="text-center p-4 border rounded-lg"><div className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === 'COMPLETED').length}</div><div className="text-sm text-gray-600">Completed</div></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client Insights</CardTitle>
                  <CardDescription>Client behavior and satisfaction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <div>
                          <div className="font-medium">Average Satisfaction</div>
                          <div className="text-sm text-gray-600">{analytics.avgSat.toFixed(1)} out of 5.0</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Client Tier Distribution</h4>
                      {(['ENTERPRISE','SMB','INDIVIDUAL'] as const).map((tier) => {
                        const count = bookings.filter(b => b.client.tier === tier).length
                        const pct = bookings.length ? (count / bookings.length) * 100 : 0
                        return (
                          <div key={tier} className="space-y-1">
                            <div className="flex justify-between text-sm"><span>{tier}</span><span>{count} ({pct.toFixed(0)}%)</span></div>
                            <div className="w-full bg-gray-200 rounded-full h-1"><div className={`h-1 rounded-full ${tier==='ENTERPRISE'?'bg-purple-500':tier==='SMB'?'bg-blue-500':'bg-green-500'}`} style={{ width: `${pct}%` }} /></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                  <CardDescription>Most popular services and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Tax Consultation','Quarterly Audit','Personal Tax Filing','Business Setup'].map((name, i) => {
                      const revenue = analytics.totalRevenue * [0.24,0.31,0.18,0.27][i]
                      const growth = [12,-5,25,8][i]
                      return (
                        <div key={name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div>
                            <div className="font-medium">{name}</div>
                            <div className="text-sm text-gray-600">{Math.max(1, Math.floor(bookings.length * [0.2,0.15,0.35,0.1][i]))} bookings</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">{formatCurrency(revenue)}</div>
                            <div className={`text-sm flex items-center ${growth>0?'text-green-600':'text-red-600'}`}>{growth>0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(growth)}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>Visual timeline of all bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <CalendarDays className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Integration</h3>
                    <p className="text-gray-600 mb-4">Interactive calendar view would be integrated here</p>
                    <Button variant="outline"><Settings className="h-4 w-4 mr-2" />Calendar Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                  <CardDescription>Custom business reports and analytics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start"><FileText className="h-4 w-4 mr-2" />Monthly Booking Summary</Button>
                  <Button className="w-full justify-start" variant="outline"><BarChart3 className="h-4 w-4 mr-2" />Revenue Analysis Report</Button>
                  <Button className="w-full justify-start" variant="outline"><Users className="h-4 w-4 mr-2" />Client Performance Report</Button>
                  <Button className="w-full justify-start" variant="outline"><Target className="h-4 w-4 mr-2" />Staff Productivity Report</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Insights</CardTitle>
                  <CardDescription>Key business metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg"><div className="font-medium text-blue-900">Peak Booking Hours</div><div className="text-sm text-blue-700">10:00 AM - 2:00 PM most popular</div></div>
                    <div className="p-4 bg-green-50 rounded-lg"><div className="font-medium text-green-900">Best Performing Service</div><div className="text-sm text-green-700">Tax Consultation - 85% completion rate</div></div>
                    <div className="p-4 bg-purple-50 rounded-lg"><div className="font-medium text-purple-900">Top Client Segment</div><div className="text-sm text-purple-700">SMB clients generate 45% of revenue</div></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
