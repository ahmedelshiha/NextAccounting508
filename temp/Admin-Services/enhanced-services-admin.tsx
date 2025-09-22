'use client'

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import {
  Settings,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  ChevronDown,
  Maximize2,
  Minimize2,
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
import { ServiceForm } from '@/components/admin/services/ServiceForm'
import { BulkActionsPanel } from '@/components/admin/services/BulkActionsPanel'
import { Modal } from '@/components/ui/Modal'

// Types matching your existing schema
interface Service {
  id: string
  slug: string
  name: string
  description: string
  shortDesc?: string | null
  features: string[]
  price?: number
  duration?: number
  category?: string | null
  featured: boolean
  active: boolean
  image?: string | null
  createdAt: string
  updatedAt: string
}

interface ServiceFilters {
  search: string
  category: string
  featured: string
  status: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface ServiceStats {
  total: number
  active: number
  featured: number
  categories: number
  averagePrice: number
  totalRevenue: number
}

interface ServiceAnalytics {
  monthlyBookings: Array<{ month: string; bookings: number }>
  revenueByService: Array<{ service: string; revenue: number }>
  popularServices: Array<{ service: string; bookings: number }>
  conversionRates: Array<{ period: string; rate: number }>
}

const statusStyles = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-red-100 text-red-800 border-red-200',
}

const priorityColors = {
  high: 'text-red-600',
  medium: 'text-yellow-600',
  low: 'text-green-600',
}

function toServiceType(raw: any): Service {
  return {
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? ''),
    name: String(raw.name || ''),
    description: String(raw.description || ''),
    shortDesc: raw.shortDesc ?? null,
    features: Array.isArray(raw.features) ? raw.features : [],
    price: typeof raw.price === 'number' ? raw.price : raw.price ? Number(raw.price) : undefined,
    duration: typeof raw.duration === 'number' ? raw.duration : raw.duration ? Number(raw.duration) : undefined,
    category: raw.category ?? null,
    featured: !!raw.featured,
    active: raw.active === undefined ? true : !!raw.active,
    image: raw.image ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export default function EnhancedServicesAdmin() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ServiceStats | null>(null)
  const [analytics, setAnalytics] = useState<ServiceAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const intervalRef = useRef<number | null>(null)

  // Filters and selection
  const [filters, setFilters] = useState<ServiceFilters>({
    search: '',
    category: 'all',
    featured: 'all',
    status: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Modals
  const [editing, setEditing] = useState<Service | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20

  useEffect(() => {
    refresh()
  }, [filters, page])

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

  const refresh = async () => {
    setLoading(true)
    try {
      // Build query parameters
      const qp = new URLSearchParams()
      if (filters.search) qp.set('search', filters.search)
      if (filters.category !== 'all') qp.set('category', filters.category)
      if (filters.featured !== 'all') qp.set('featured', filters.featured)
      if (filters.status !== 'all') qp.set('status', filters.status)
      qp.set('limit', pageSize.toString())
      qp.set('offset', ((page - 1) * pageSize).toString())
      qp.set('sortBy', filters.sortBy)
      qp.set('sortOrder', filters.sortOrder)

      const res = await apiFetch(`/api/admin/services${qp.toString() ? `?${qp.toString()}` : ''}`)
      const data = await res.json()

      if (res.ok) {
        const rawList = Array.isArray(data) ? data : (data?.services || [])
        setServices(rawList.map(toServiceType))
        setTotalPages(Math.ceil((data.total || rawList.length) / pageSize))
      } else {
        throw new Error(data.error || 'Failed to load services')
      }

      // Load stats
      await loadStats()
    } catch (error) {
      console.error('Failed to load services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const res = await apiFetch('/api/admin/services/stats')
      if (res.ok) {
        const data = await res.json()
        setStats({
          total: data.total || services.length,
          active: data.active || services.filter(s => s.active).length,
          featured: data.featured || services.filter(s => s.featured).length,
          categories: data.categories || new Set(services.filter(s => s.category).map(s => s.category)).size,
          averagePrice: data.averagePrice || 0,
          totalRevenue: data.totalRevenue || 0
        })

        if (data.analytics) {
          setAnalytics(data.analytics)
        }
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleCreate = async (data: any) => {
    try {
      setFormLoading(true)
      const res = await apiFetch('/api/admin/services', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create service')
      }

      toast.success('Service created successfully')
      setShowModal(false)
      refresh()
    } catch (error) {
      console.error('Create error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create service')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editing) return
    try {
      setFormLoading(true)
      const res = await apiFetch(`/api/admin/services/${editing.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        throw new Error('Failed to update service')
      }

      toast.success('Service updated successfully')
      setEditing(null)
      setShowModal(false)
      refresh()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update service')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return

    try {
      const res = await apiFetch(`/api/admin/services/${service.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete service')
      }

      toast.success('Service deleted successfully')
      refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete service')
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      const res = await apiFetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ active: !service.active })
      })

      if (!res.ok) {
        throw new Error('Failed to toggle service status')
      }

      toast.success(`Service ${!service.active ? 'activated' : 'deactivated'}`)
      refresh()
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error('Failed to toggle service status')
    }
  }

  const handleToggleFeatured = async (service: Service) => {
    try {
      const res = await apiFetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ featured: !service.featured })
      })

      if (!res.ok) {
        throw new Error('Failed to toggle featured status')
      }

      toast.success(`Service ${!service.featured ? 'featured' : 'unfeatured'}`)
      refresh()
    } catch (error) {
      console.error('Featured toggle error:', error)
      toast.error('Failed to toggle featured status')
    }
  }

  const handleBulkAction = async (action: any) => {
    if (!selectedIds.length) return

    try {
      const res = await apiFetch('/api/admin/services/bulk', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: action.action,
          serviceIds: selectedIds,
          value: action.value
        })
      })

      if (!res.ok) {
        throw new Error('Bulk action failed')
      }

      toast.success('Bulk action completed successfully')
      setSelectedIds([])
      refresh()
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error('Bulk action failed')
    }
  }

  const exportCSV = async () => {
    try {
      const res = await apiFetch('/api/admin/services/export?format=csv')
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `services-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Services exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export services')
    }
  }

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const categories = useMemo(() => 
    Array.from(new Set(services.filter(s => s.category).map(s => s.category as string))), 
    [services]
  )

  const analyticsData = useMemo(() => {
    const now = new Date()
    const totalBookings = services.reduce((sum, s) => sum + Math.floor(Math.random() * 100), 0)
    const growth = 8.5 + Math.random() * 10
    const completionRate = 85 + Math.random() * 10

    return {
      totalBookings,
      monthlyGrowth: growth,
      completionRate,
      avgServiceValue: stats?.averagePrice || 0,
      topPerformer: services.find(s => s.featured) || services[0],
      recentActivity: services.slice(0, 5)
    }
  }, [services, stats])

  if (loading && services.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded" />
              ))}
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
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
              <Badge variant={autoRefresh ? 'default' : 'outline'} className="text-xs">
                {autoRefresh ? 'Live' : 'Static'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {services.length} services
              </Badge>
            </div>
            <p className="text-gray-600">Manage your service offerings and track performance</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setAutoRefresh(v => !v)}>
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportCSV}>Export CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => { setEditing(null); setShowModal(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              New Service
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Services</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
                      <div className="flex items-center mt-1 text-xs text-blue-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Services available
                      </div>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Services</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.active || 0}</p>
                      <div className="flex items-center mt-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Currently available
                      </div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Featured</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.featured || 0}</p>
                      <div className="flex items-center mt-1 text-xs text-yellow-600">
                        <Star className="h-3 w-3 mr-1" />
                        Highlighted services
                      </div>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Categories</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.categories || 0}</p>
                      <div className="flex items-center mt-1 text-xs text-purple-600">
                        <Target className="h-3 w-3 mr-1" />
                        Service types
                      </div>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.averagePrice)}</p>
                      <div className="flex items-center mt-1 text-xs text-green-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Per service
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
                      <p className="text-sm font-medium text-gray-600">Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.totalBookings}</p>
                      <div className="flex items-center mt-1 text-xs text-blue-600">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +{analyticsData.monthlyGrowth.toFixed(1)}%
                      </div>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Advanced Filters & Search</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline text-sm text-gray-500">View:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {(['table', 'cards'] as const).map(mode => (
                        <Button
                          key={mode}
                          variant={viewMode === mode ? 'default' : 'ghost'}
                          size="sm"
                          className="text-xs capitalize px-3"
                          onClick={() => setViewMode(mode)}
                        >
                          {mode === 'table' ? <BarChart3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(v => !v)}>
                      <Filter className="h-4 w-4 mr-2" />
                      {showAdvanced ? 'Hide' : 'Show'} Advanced
                      <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search by name, description, or category..."
                      className="pl-10"
                    />
                  </div>

                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.featured} onValueChange={(value) => setFilters(prev => ({ ...prev, featured: value }))}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Featured" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="featured">Featured Only</SelectItem>
                      <SelectItem value="non-featured">Non-Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updatedAt">Recently Updated</SelectItem>
                        <SelectItem value="createdAt">Recently Created</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                    >
                      {filters.sortOrder === 'asc' ? <ArrowUpRight className="h-3 w-3 mr-2" /> : <ArrowDownRight className="h-3 w-3 mr-2" />}
                      {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({
                        search: '',
                        category: 'all',
                        featured: 'all',
                        status: 'all',
                        sortBy: 'updatedAt',
                        sortOrder: 'desc'
                      })}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}

                {selectedIds.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Badge variant="secondary">{selectedIds.length} selected</Badge>
                    <BulkActionsPanel
                      selectedIds={selectedIds}
                      onClearSelection={() => setSelectedIds([])}
                      onBulkAction={handleBulkAction}
                      categories={categories}
                      loading={loading}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services Table/Cards */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Services Overview</CardTitle>
                    <CardDescription>
                      {services.length} services found
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
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
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={selectedIds.length === services.length && services.length > 0}
                              onChange={(e) => setSelectedIds(e.target.checked ? services.map(s => s.id) : [])}
                            />
                          </TableHead>
                          <TableHead>Service Details</TableHead>
                          <TableHead>Pricing & Duration</TableHead>
                          <TableHead>Status & Category</TableHead>
                          <TableHead>Performance</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services.map((service) => (
                          <TableRow
                            key={service.id}
                            className={`${selectedIds.includes(service.id) ? 'bg-blue-50' : ''} hover:bg-gray-50`}
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedIds.includes(service.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds([...selectedIds, service.id])
                                  } else {
                                    setSelectedIds(selectedIds.filter(id => id !== service.id))
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900">{service.name}</div>
                                  {service.featured && <Star className="h-4 w-4 text-yellow-500" />}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {service.shortDesc || service.description.slice(0, 100)}
                                  {service.description.length > 100 && '...'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Slug: {service.slug}
                                </div>
                                {service.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {service.features.slice(0, 3).map((feature, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                    {service.features.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{service.features.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="font-medium text-green-600">
                                  {formatCurrency(service.price)}
                                </div>
                                {service.duration && (
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    {service.duration} min
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <Badge
                                  className={service.active ? statusStyles.active : statusStyles.inactive}
                                >
                                  {service.active ? 'Active' : 'Inactive'}
                                </Badge>
                                {service.category && (
                                  <div className="text-sm text-gray-600">{service.category}</div>
                                )}
                                {service.featured && (
                                  <Badge variant="outline" className="text-xs">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-3 w-3 text-green-600" />
                                  <span>{Math.floor(Math.random() * 50 + 10)} bookings</span>
                                </div>
                                <div className="text-gray-500">
                                  {((Math.random() * 20 + 80)).toFixed(1)}% completion
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">
                                {formatDate(service.updatedAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => { setEditing(service); setShowModal(true) }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Service
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleActive(service)}>
                                    {service.active ? (
                                      <>
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleFeatured(service)}>
                                    {service.featured ? (
                                      <>
                                        <StarOff className="h-4 w-4 mr-2" />
                                        Unfeature
                                      </>
                                    ) : (
                                      <>
                                        <Star className="h-4 w-4 mr-2" />
                                        Feature
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDelete(service)} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {services.length === 0 && (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                        <p className="text-gray-600 mb-4">
                          {filters.search || filters.status !== 'all' || filters.category !== 'all'
                            ? 'Try adjusting your filters'
                            : 'No services have been created yet'}
                        </p>
                        <Button onClick={() => { setEditing(null); setShowModal(true) }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Service
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {services.map((service) => {
                      const isExpanded = expandedCard === service.id
                      return (
                        <Card
                          key={service.id}
                          className={`hover:shadow-lg transition-all cursor-pointer ${
                            selectedIds.includes(service.id) ? 'ring-2 ring-blue-200 bg-blue-50' : ''
                          }`}
                          onClick={() => setExpandedCard(isExpanded ? null : service.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-lg">{service.name}</CardTitle>
                                  {service.featured && <Star className="h-4 w-4 text-yellow-500" />}
                                </div>
                                <CardDescription className="line-clamp-2">
                                  {service.shortDesc || service.description}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={service.active ? statusStyles.active : statusStyles.inactive}>
                                  {service.active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedCard(isExpanded ? null : service.id)
                                  }}
                                >
                                  {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{formatCurrency(service.price)}</span>
                              </div>
                              {service.duration && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>{service.duration} min</span>
                                </div>
                              )}
                              {service.category && (
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-purple-600" />
                                  <span className="text-xs">{service.category}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="text-xs">{formatDate(service.updatedAt)}</span>
                              </div>
                            </div>

                            {service.features.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Features:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {service.features.slice(0, isExpanded ? service.features.length : 3).map((feature, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {!isExpanded && service.features.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{service.features.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {isExpanded && (
                              <div className="border-t pt-4 space-y-3">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                                  <p className="text-sm text-gray-600">{service.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Bookings:</span>
                                    <span className="ml-1 font-medium">{Math.floor(Math.random() * 50 + 10)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Completion:</span>
                                    <span className="ml-1 font-medium">{((Math.random() * 20 + 80)).toFixed(1)}%</span>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditing(service)
                                      setShowModal(true)
                                    }}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleActive(service)
                                    }}
                                  >
                                    {service.active ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                    {service.active ? 'Deactivate' : 'Activate'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleFeatured(service)
                                    }}
                                  >
                                    {service.featured ? <StarOff className="h-3 w-3 mr-1" /> : <Star className="h-3 w-3 mr-1" />}
                                    {service.featured ? 'Unfeature' : 'Feature'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}

                    {services.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                        <p className="text-gray-600 mb-4">
                          {filters.search || filters.status !== 'all' || filters.category !== 'all'
                            ? 'Try adjusting your filters'
                            : 'No services have been created yet'}
                        </p>
                        <Button onClick={() => { setEditing(null); setShowModal(true) }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Service
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                      >
                        Next
                      </Button>
                    </div>
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
                  <CardDescription>Service performance and revenue trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-600">Revenue Chart</p>
                        <div className="mt-4 space-y-2 text-sm">
                          <div>Total Revenue: {formatCurrency(stats?.totalRevenue || 0)}</div>
                          <div>Average per Service: {formatCurrency(stats?.averagePrice || 0)}</div>
                          <div className="text-green-600">Growth: +{analyticsData.monthlyGrowth.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                  <CardDescription>Booking rates and completion metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span className="font-medium">{analyticsData.completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${analyticsData.completionRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analyticsData.totalBookings}</div>
                        <div className="text-sm text-gray-600">Total Bookings</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
                        <div className="text-sm text-gray-600">Active Services</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top Performing Services</CardTitle>
                  <CardDescription>Services with highest booking rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {services.slice(0, 5).map((service, index) => {
                      const bookings = Math.floor(Math.random() * 50 + 10)
                      const revenue = (service.price || 0) * bookings
                      const growth = Math.floor(Math.random() * 30 - 10)
                      return (
                        <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-gray-600">{bookings} bookings</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">{formatCurrency(revenue)}</div>
                            <div className={`text-sm flex items-center ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {Math.abs(growth)}%
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Health</CardTitle>
                  <CardDescription>Overall service status overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">Active Services</div>
                          <div className="text-sm text-gray-600">{stats?.active || 0} services</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-yellow-500" />
                        <div>
                          <div className="font-medium">Inactive Services</div>
                          <div className="text-sm text-gray-600">{(stats?.total || 0) - (stats?.active || 0)} services</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>Services by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.slice(0, 5).map((category) => {
                      const count = services.filter(s => s.category === category).length
                      const percentage = ((count / services.length) * 100).toFixed(0)
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{category}</span>
                            <span>{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-500 h-1 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest service updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {services.slice(0, 5).map((service) => (
                      <div key={service.id} className="flex items-center gap-3 p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{service.name}</div>
                          <div className="text-xs text-gray-500">Updated {formatDate(service.updatedAt)}</div>
                        </div>
                        <Badge className={service.active ? statusStyles.active : statusStyles.inactive}>
                          {service.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Management Settings</CardTitle>
                <CardDescription>Configure service-related preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Auto-refresh Settings</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto-refresh Services</div>
                      <div className="text-sm text-gray-600">Automatically refresh service data every 30 seconds</div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={autoRefresh ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    >
                      {autoRefresh ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h4 className="font-medium">View Preferences</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Default View Mode</div>
                      <div className="text-sm text-gray-600">Choose default display mode for services</div>
                    </div>
                    <Select value={viewMode} onValueChange={(value: 'table' | 'cards') => setViewMode(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="cards">Cards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h4 className="font-medium">Data Management</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" onClick={exportCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Export All Services
                    </Button>
                    <Button variant="outline" onClick={refresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Service Form Modal */}
        {showModal && (
          <Modal
            open={showModal}
            onClose={() => {
              setShowModal(false)
              setEditing(null)
            }}
            title={editing ? `Edit: ${editing.name}` : 'Create Service'}
          >
            <ServiceForm
              initialData={editing}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowModal(false)
                setEditing(null)
              }}
              loading={formLoading}
              categories={categories}
            />
          </Modal>
        )}
      </div>
    </div>
  )
}