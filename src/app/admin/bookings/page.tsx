'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
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
  MoreHorizontal
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  scheduledAt: string
  duration: number
  status: string
  notes?: string
  createdAt: string
  service: {
    name: string
    price?: number
  }
  client: {
    name: string
    email: string
  }
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await apiFetch('/api/admin/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await apiFetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Refresh bookings
        fetchBookings()
      }
    } catch (error) {
      console.error('Error updating booking status:', error)
    }
  }

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const response = await apiFetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
      })

      if (response.ok) {
        // Refresh bookings
        fetchBookings()
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter

    const now = new Date()
    const bookingDate = new Date(booking.scheduledAt)
    let matchesDate = true

    if (dateFilter === 'today') {
      matchesDate = bookingDate.toDateString() === now.toDateString()
    } else if (dateFilter === 'upcoming') {
      matchesDate = bookingDate > now
    } else if (dateFilter === 'past') {
      matchesDate = bookingDate < now
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const exportBookings = () => {
    const csvContent = [
      ['Client Name', 'Email', 'Phone', 'Service', 'Date', 'Time', 'Duration', 'Status', 'Price'],
      ...filteredBookings.map(booking => [
        booking.clientName,
        booking.clientEmail,
        booking.clientPhone || '',
        booking.service.name,
        formatDate(booking.scheduledAt),
        formatTime(booking.scheduledAt),
        `${booking.duration} min`,
        booking.status,
        booking.service.price ? formatCurrency(booking.service.price) : ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="bg-gray-200 rounded-lg h-96"></div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
              <p className="text-gray-600 mt-2">
                Manage client appointments and bookings
              </p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={exportBookings} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button asChild>
                <Link href="/admin">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => b.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => b.status === 'CONFIRMED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      bookings
                        .filter(b => b.status === 'COMPLETED')
                        .reduce((sum, b) => sum + (b.service.price || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by client name, email, or service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
            <CardDescription>
              {filteredBookings.length === bookings.length 
                ? 'All bookings' 
                : `Filtered from ${bookings.length} total bookings`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.clientName}</div>
                          <div className="text-sm text-gray-600 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {booking.clientEmail}
                          </div>
                          {booking.clientPhone && (
                            <div className="text-sm text-gray-600 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {booking.clientPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{booking.service.name}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatDate(booking.scheduledAt)}</div>
                          <div className="text-sm text-gray-600">{formatTime(booking.scheduledAt)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          {booking.duration} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booking.service.price ? formatCurrency(booking.service.price) : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/bookings/${booking.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {booking.status === 'PENDING' && (
                              <DropdownMenuItem onClick={() => handleConfirmBooking(booking.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirm Booking
                              </DropdownMenuItem>
                            )}
                            {booking.status !== 'CANCELLED' && (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(booking.id, 'CANCELLED')}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Booking
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredBookings.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No bookings have been made yet'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
