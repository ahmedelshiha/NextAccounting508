"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users,
  Search,
  Download,
  RefreshCw,
  Plus,
  Eye,
  Loader2,
  Edit3,
  UserCheck,
  Clock,
  Mail,
  Phone,
  Building,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column } from '@/types/dashboard'

interface Client {
  id: string
  name: string | null
  email: string
  phone?: string | null
  company?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  tier?: 'INDIVIDUAL' | 'SMB' | 'ENTERPRISE' | null
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null
  totalBookings?: number
  totalRevenue?: number
  lastBooking?: string | null
  satisfaction?: number | null
  createdAt: string
  updatedAt?: string | null
  notes?: string | null
}

interface ClientStats {
  total: number
  active: number
  newThisMonth: number
  totalRevenue: number
  averageRevenue: number
  retention: number
  satisfaction: number
  growth: number
}

const EMPTY_STATS: ClientStats = {
  total: 0,
  active: 0,
  newThisMonth: 0,
  totalRevenue: 0,
  averageRevenue: 0,
  retention: 0,
  satisfaction: 0,
  growth: 0
}

export default function ClientsPage() {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<ClientStats>(EMPTY_STATS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<keyof Client>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 25

  const { role, canManageUsers } = usePermissions()

  const loadClients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedTier !== 'all' && { tier: selectedTier }),
        ...(selectedStatus !== 'all' && { status: selectedStatus })
      })

      const [clientsRes, statsRes] = await Promise.allSettled([
        apiFetch(`/api/admin/users?${params.toString()}&role=CLIENT`),
        apiFetch('/api/admin/stats/clients')
      ])

      if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
        const clientData = await clientsRes.value.json()
        setClients(clientData?.users || [])
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsData = await statsRes.value.json()
        setStats(statsData?.data || EMPTY_STATS)
      }
    } catch (err) {
      console.error('Error loading clients:', err)
      setError('Failed to load clients data')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, selectedTier, selectedStatus, sortBy, sortOrder])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let filtered = [...clients]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(client => 
        client.name?.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.company?.toLowerCase().includes(term)
      )
    }

    if (selectedTier !== 'all') {
      filtered = filtered.filter(client => client.tier === selectedTier.toUpperCase())
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(client => client.status === selectedStatus.toUpperCase())
    }

    return filtered
  }, [clients, searchTerm, selectedTier, selectedStatus])

  const handleSort = (column: keyof Client) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const exportClients = () => {
    const csvData = filteredClients.map(client => ({
      Name: client.name || '',
      Email: client.email,
      Phone: client.phone || '',
      Company: client.company || '',
      Tier: client.tier || '',
      Status: client.status || '',
      'Total Bookings': client.totalBookings || 0,
      'Total Revenue': client.totalRevenue || 0,
      'Last Booking': client.lastBooking || '',
      'Created At': new Date(client.createdAt).toLocaleDateString()
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<Client>[] = [
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true,
      render: (value, client) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">
              {(client.name || client.email)?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {client.name || 'Unnamed Client'}
            </div>
            <div className="text-sm text-gray-500">{client.email}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'company', 
      label: 'Company', 
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <Building className="w-4 h-4 text-gray-400" />
          <span>{value || '-'}</span>
        </div>
      )
    },
    { 
      key: 'tier', 
      label: 'Tier', 
      sortable: true,
      render: (value) => {
        const tierColors = {
          INDIVIDUAL: 'bg-gray-100 text-gray-800',
          SMB: 'bg-blue-100 text-blue-800',
          ENTERPRISE: 'bg-purple-100 text-purple-800'
        }
        return (
          <Badge className={tierColors[value as keyof typeof tierColors] || 'bg-gray-100 text-gray-800'}>
            {value || 'Individual'}
          </Badge>
        )
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => {
        const statusColors = {
          ACTIVE: 'bg-green-100 text-green-800',
          INACTIVE: 'bg-gray-100 text-gray-800',
          SUSPENDED: 'bg-red-100 text-red-800'
        }
        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-green-100 text-green-800'}>
            {value || 'Active'}
          </Badge>
        )
      }
    },
    { 
      key: 'totalBookings', 
      label: 'Bookings', 
      sortable: true, 
      align: 'center',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{value || 0}</span>
        </div>
      )
    },
    { 
      key: 'totalRevenue', 
      label: 'Revenue', 
      sortable: true, 
      align: 'right',
      render: (value) => (
        <div className="flex items-center justify-end gap-1">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span>${Number(value || 0).toLocaleString()}</span>
        </div>
      )
    },
    { 
      key: 'lastBooking', 
      label: 'Last Booking', 
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{value ? new Date(value).toLocaleDateString() : 'Never'}</span>
        </div>
      )
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, client) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/admin/clients/${client.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          {canManageUsers && (
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={`/admin/clients/${client.id}/edit`}>
                <Edit3 className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      )
    }
  ]

  const filterConfigs = [
    {
      key: 'tier',
      label: 'Client Tier',
      options: [
        { value: 'all', label: 'All Tiers' },
        { value: 'individual', label: 'Individual' },
        { value: 'smb', label: 'SMB' },
        { value: 'enterprise', label: 'Enterprise' }
      ],
      value: selectedTier
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' }
      ],
      value: selectedStatus
    }
  ]

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'tier') setSelectedTier(value)
    if (key === 'status') setSelectedStatus(value)
  }

  return (
    <ListPage
      title="Client Management"
      subtitle="Manage your client relationships and data"
      primaryAction={canManageUsers ? { label: 'Add Client', onClick: () => window.location.href = '/admin/clients/new', icon: Plus } : undefined}
      secondaryActions={[
        { label: 'Export CSV', onClick: exportClients, icon: Download },
        { label: 'Refresh', onClick: loadClients, icon: RefreshCw }
      ]}
      onSearch={setSearchTerm}
      searchPlaceholder="Search clients..."
      filters={filterConfigs}
      onFilterChange={handleFilterChange}
      columns={columns}
      rows={filteredClients}
      loading={loading}
      stats={{
        title: 'Client Overview',
        items: [
          {
            label: 'Total Clients',
            value: stats.total.toString(),
            icon: Users,
            color: 'text-blue-600'
          },
          {
            label: 'Active Clients',
            value: stats.active.toString(),
            icon: UserCheck,
            color: 'text-green-600'
          },
          {
            label: 'New This Month',
            value: stats.newThisMonth.toString(),
            icon: stats.growth >= 0 ? TrendingUp : TrendingDown,
            color: stats.growth >= 0 ? 'text-green-600' : 'text-red-600',
            change: `${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%`
          },
          {
            label: 'Total Revenue',
            value: `$${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-green-600'
          },
          {
            label: 'Avg Revenue/Client',
            value: `$${stats.averageRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-purple-600'
          },
          {
            label: 'Satisfaction',
            value: `${stats.satisfaction.toFixed(1)}/5.0`,
            icon: UserCheck,
            color: 'text-yellow-600'
          }
        ]
      }}
      pagination={{
        currentPage,
        onPageChange: setCurrentPage,
        totalItems: stats.total,
        pageSize
      }}
    />
  )
}