'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Users,
  MapPin,
  DollarSign,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Plus,
  Save,
  MessageSquare,
  FileText,
  Activity,
  AlertTriangle,
  Edit3,
  User,
  Building2,
  Star,
  Target,
  Zap,
  Send,
  Paperclip,
  ExternalLink,
  CalendarDays,
  Timer,
  Receipt,
  Settings,
  Bell,
  Archive,
  Copy,
  Download,
  Share2,
  History
} from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { toast as toastLib } from '@/lib/toast-api'

const toast = {
  success: (message: string) => {
    try {
      if (typeof toastLib?.success === 'function') {
        toastLib.success(message)
      } else {
        console.log('✅ Success:', message)
      }
    } catch {
      console.log('✅ Success:', message)
    }
  },
  error: (message: string) => {
    try {
      if (typeof toastLib?.error === 'function') {
        toastLib.error(message)
      } else {
        console.error('❌ Error:', message)
      }
    } catch {
      console.error('❌ Error:', message)
    }
  }
}

interface BookingDetail {
  id: string
  clientId?: string | null
  serviceId?: string | null
  serviceName?: string | null
  serviceCategory?: string | null
  servicePrice?: number | null
  serviceDuration?: number | null
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  scheduledAt: string
  duration: number
  notes?: string | null
  adminNotes?: string | null
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  confirmed?: boolean
  reminderSent?: boolean
  location?: 'OFFICE' | 'REMOTE' | 'CLIENT_SITE' | null
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null
  source?: 'WEBSITE' | 'PHONE' | 'REFERRAL' | 'WALK_IN' | 'MARKETING' | null
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | null
  totalAmount?: number | null
  createdAt: string
  updatedAt?: string | null
  assignedTeamMember?: {
    id: string
    name: string
    email: string
    role?: string
  } | null
  client?: {
    id?: string
    name?: string | null
    email: string
    phone?: string | null
    tier?: 'INDIVIDUAL' | 'SMB' | 'ENTERPRISE' | null
    company?: string | null
    totalBookings?: number
    totalRevenue?: number
    averageRating?: number
    lastBookingDate?: string
  } | null
  service?: {
    id?: string
    name?: string | null
    description?: string | null
    price?: number | null
    category?: string | null
    duration?: number | null
    requirements?: string[] | null
  } | null
  tasks?: Array<{
    id: string
    title: string
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
    assignedTo?: string
    dueDate?: string
    createdAt: string
  }> | null
}

interface Comment {
  id: string
  content: string
  authorId: string
  authorName: string
  authorRole?: string
  createdAt: string
  updatedAt?: string | null
  attachments?: Array<{
    name: string
    size: number
    type: string
    url: string
  }> | null
  parentId?: string | null
  isInternal?: boolean
}

interface TeamMemberLite { 
  id: string
  name: string
  email: string
  role?: string
  department?: string
  isAvailable?: boolean 
}

interface ServiceLite {
  id: string
  name: string
  description?: string
  price?: number
  duration?: number
  category?: string
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Form states
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [editingBooking, setEditingBooking] = useState(false)
  const [editedSchedule, setEditedSchedule] = useState({ date: '', time: '' })
  const [editedLocation, setEditedLocation] = useState<string>('')
  const [editedPriority, setEditedPriority] = useState<string>('')

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'internal' | 'client'>('internal')
  const [postingComment, setPostingComment] = useState(false)

  // Teams and Services
  const [teamMembers, setTeamMembers] = useState<TeamMemberLite[]>([])
  const [services, setServices] = useState<ServiceLite[]>([])
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')

  // Tasks
  const [newTask, setNewTask] = useState({ title: '', priority: 'NORMAL', dueDate: '' })
  const [creatingTask, setCreatingTask] = useState(false)

  const { canManageBookings, role } = usePermissions()

  const loadBookingData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [bookingRes, commentsRes, teamRes, servicesRes] = await Promise.allSettled([
        apiFetch(`/api/bookings/${id}`),
        apiFetch(`/api/bookings/${id}/comments`),
        apiFetch('/api/admin/team-members'),
        apiFetch('/api/services')
      ])

      if (bookingRes.status === 'fulfilled' && bookingRes.value.ok) {
        const data = await bookingRes.value.json()
        setBooking(data)
        setAdminNotes(data.adminNotes || '')
        setEditedSchedule({
          date: new Date(data.scheduledAt).toISOString().split('T')[0],
          time: new Date(data.scheduledAt).toTimeString().slice(0, 5)
        })
        setEditedLocation(data.location || '')
        setEditedPriority(data.priority || 'NORMAL')
        setSelectedService(data.serviceId || '')
        setSelectedAssignee(data.assignedTeamMember?.id || '')
      } else {
        throw new Error('Failed to load booking')
      }

      if (commentsRes.status === 'fulfilled' && commentsRes.value.ok) {
        const data = await commentsRes.value.json()
        setComments(data.comments || [])
      }

      if (teamRes.status === 'fulfilled' && teamRes.value.ok) {
        const data = await teamRes.value.json()
        setTeamMembers(data.teamMembers || [])
      }

      if (servicesRes.status === 'fulfilled' && servicesRes.value.ok) {
        const data = await servicesRes.value.json()
        setServices(data.services || [])
      }
    } catch (err) {
      console.error('Error loading booking data:', err)
      setError('Failed to load booking data')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadBookingData()
    }
  }, [id, loadBookingData])

  const updateBookingStatus = async (status: string) => {
    if (!booking) return
    
    setUpdatingStatus(status)
    try {
      const res = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          confirmed: status === 'CONFIRMED' ? true : undefined 
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
        toast.success(`Booking ${status.toLowerCase()} successfully`)
        
        // Auto-add comment for status change
        await postComment(`Booking status updated to ${status}`, 'internal', true)
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update booking status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const saveBookingChanges = async () => {
    if (!booking) return
    
    try {
      setSavingNotes(true)
      const scheduledAt = new Date(`${editedSchedule.date}T${editedSchedule.time}:00.000Z`)
      
      const res = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminNotes,
          scheduledAt: scheduledAt.toISOString(),
          location: editedLocation,
          priority: editedPriority,
          serviceId: selectedService,
          assignedTeamMemberId: selectedAssignee || null
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
        setEditingBooking(false)
        toast.success('Booking updated successfully')
        
        // Auto-add comment for changes
        await postComment('Booking details updated by admin', 'internal', true)
      } else {
        throw new Error('Failed to save changes')
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('Failed to save booking changes')
    } finally {
      setSavingNotes(false)
    }
  }

  const postComment = async (content: string = newComment, type: string = commentType, isSystemComment: boolean = false) => {
    if (!content.trim() && !isSystemComment) return
    
    setPostingComment(true)
    try {
      const res = await apiFetch(`/api/bookings/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          isInternal: type === 'internal',
          isSystem: isSystemComment
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data])
        if (!isSystemComment) {
          setNewComment('')
          toast.success('Comment posted successfully')
        }
      } else {
        throw new Error('Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      if (!isSystemComment) {
        toast.error('Failed to post comment')
      }
    } finally {
      setPostingComment(false)
    }
  }

  const createTask = async () => {
    if (!newTask.title.trim()) return
    
    setCreatingTask(true)
    try {
      const res = await apiFetch(`/api/bookings/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          priority: newTask.priority,
          dueDate: newTask.dueDate || null,
          assignedTo: selectedAssignee || null
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setBooking(prev => ({
          ...prev!,
          tasks: [...(prev?.tasks || []), data]
        }))
        setNewTask({ title: '', priority: 'NORMAL', dueDate: '' })
        toast.success('Task created successfully')
        
        // Auto-add comment for task creation
        await postComment(`Task created: ${newTask.title}`, 'internal', true)
      } else {
        throw new Error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    } finally {
      setCreatingTask(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      CONFIRMED: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
      COMPLETED: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
      NO_SHOW: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: XCircle }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon
    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority?: string | null) => {
    if (!priority) return null
    const priorityConfig = {
      LOW: { color: 'bg-gray-100 text-gray-600', icon: null },
      NORMAL: { color: 'bg-blue-100 text-blue-600', icon: null },
      HIGH: { color: 'bg-orange-100 text-orange-600', icon: AlertTriangle },
      URGENT: { color: 'bg-red-100 text-red-600', icon: AlertTriangle }
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    const Icon = config?.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {Icon && <Icon className="w-3 h-3" />}
        {priority.charAt(0) + priority.slice(1).toLowerCase()}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const formatCurrency = (amount?: number | null) => {
    return amount ? `$${amount.toLocaleString()}` : 'TBD'
  }

  const getClientTierBadge = (tier?: string | null) => {
    if (!tier) return null
    const tierConfig = {
      INDIVIDUAL: { color: 'bg-gray-100 text-gray-600', icon: User },
      SMB: { color: 'bg-blue-100 text-blue-600', icon: Building2 },
      ENTERPRISE: { color: 'bg-purple-100 text-purple-600', icon: Building2 }
    }
    const config = tierConfig[tier as keyof typeof tierConfig]
    const Icon = config?.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {tier.charAt(0) + tier.slice(1).toLowerCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The requested booking could not be found.'}</p>
            <Button asChild>
              <Link href="/admin/bookings">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Bookings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/bookings">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Bookings
                  </Link>
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Booking #{booking.id.slice(-8).toUpperCase()}
                  </h1>
                  <div className="flex items-center space-x-3 mt-1">
                    {getStatusBadge(booking.status)}
                    {getPriorityBadge(booking.priority)}
                    <span className="text-sm text-gray-500">
                      Created {formatDate(booking.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {booking.status === 'PENDING' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => updateBookingStatus('CONFIRMED')}
                    disabled={updatingStatus === 'CONFIRMED'}
                  >
                    {updatingStatus === 'CONFIRMED' ? 'Confirming...' : 'Confirm Booking'}
                  </Button>
                )}
                {booking.status === 'CONFIRMED' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => updateBookingStatus('COMPLETED')}
                    disabled={updatingStatus === 'COMPLETED'}
                  >
                    {updatingStatus === 'COMPLETED' ? 'Completing...' : 'Mark Complete'}
                  </Button>
                )}
                {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => updateBookingStatus('CANCELLED')}
                    disabled={updatingStatus === 'CANCELLED'}
                  >
                    {updatingStatus === 'CANCELLED' ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                )}
                {canManageBookings && (
                  <Button
                    variant={editingBooking ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setEditingBooking(!editingBooking)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {editingBooking ? 'Cancel Edit' : 'Edit Booking'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="comments">
                  Comments
                  {comments.length > 0 && (
                    <Badge className="ml-2 bg-blue-100 text-blue-800">{comments.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  Tasks
                  {booking.tasks && booking.tasks.length > 0 && (
                    <Badge className="ml-2 bg-green-100 text-green-800">{booking.tasks.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Booking Details */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Booking Details</CardTitle>
                      {editingBooking && canManageBookings && (
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingBooking(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={saveBookingChanges}
                            disabled={savingNotes}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {savingNotes ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Service Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Service Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {editingBooking ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Service
                            </label>
                            <Select value={selectedService} onValueChange={setSelectedService}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                              <SelectContent>
                                {services.map(service => (
                                  <SelectItem key={service.id} value={service.id}>
                                    {service.name} - {formatCurrency(service.price)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-600">Service</p>
                            <p className="font-semibold text-gray-900">
                              {booking.serviceName || 'No service specified'}
                            </p>
                            {booking.serviceCategory && (
                              <p className="text-sm text-gray-500">{booking.serviceCategory}</p>
                            )}
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(booking.servicePrice || booking.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Schedule Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Schedule & Location</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {editingBooking ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                              </label>
                              <Input
                                type="date"
                                value={editedSchedule.date}
                                onChange={(e) => setEditedSchedule(prev => ({ ...prev, date: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time
                              </label>
                              <Input
                                type="time"
                                value={editedSchedule.time}
                                onChange={(e) => setEditedSchedule(prev => ({ ...prev, time: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                              </label>
                              <Select value={editedLocation} onValueChange={setEditedLocation}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="OFFICE">Office</SelectItem>
                                  <SelectItem value="REMOTE">Remote</SelectItem>
                                  <SelectItem value="CLIENT_SITE">Client Site</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-sm text-gray-600">Date & Time</p>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {formatDate(booking.scheduledAt)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatTime(booking.scheduledAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600">Duration</p>
                              <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">
                                  {booking.duration} minutes
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600">Location</p>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">
                                  {booking.location || 'TBD'}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Assignment & Priority */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Assignment & Priority</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {editingBooking ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assigned To
                              </label>
                              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Unassigned</SelectItem>
                                  {teamMembers.map(member => (
                                    <SelectItem key={member.id} value={member.id}>
                                      {member.name} ({member.role})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                              </label>
                              <Select value={editedPriority} onValueChange={setEditedPriority}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LOW">Low</SelectItem>
                                  <SelectItem value="NORMAL">Normal</SelectItem>
                                  <SelectItem value="HIGH">High</SelectItem>
                                  <SelectItem value="URGENT">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-sm text-gray-600">Assigned To</p>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">
                                  {booking.assignedTeamMember?.name || 'Unassigned'}
                                </span>
                                {booking.assignedTeamMember?.role && (
                                  <Badge variant="outline">{booking.assignedTeamMember.role}</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600">Priority</p>
                              {getPriorityBadge(booking.priority)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Notes */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Notes</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client Notes
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md min-h-[60px]">
                            {booking.notes || 'No notes provided by client'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Admin Notes
                          </label>
                          {editingBooking ? (
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add internal notes for this booking..."
                              rows={4}
                            />
                          ) : (
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md min-h-[60px]">
                              {booking.adminNotes || 'No admin notes'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="space-y-6">
                {/* Comments Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Team & Client Communication
                      </CardTitle>
                      <Badge variant="outline">{comments.length} Comments</Badge>
                    </div>
                    <CardDescription>
                      Communicate with team members and clients about this booking. 
                      Internal comments are only visible to team members.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Comment Type Selector */}
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-md">
                      <span className="text-sm font-medium text-gray-700">Comment Type:</span>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="commentType"
                            value="internal"
                            checked={commentType === 'internal'}
                            onChange={(e) => setCommentType(e.target.value as 'internal' | 'client')}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Internal (Team Only)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="commentType"
                            value="client"
                            checked={commentType === 'client'}
                            onChange={(e) => setCommentType(e.target.value as 'internal' | 'client')}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Client Visible</span>
                        </label>
                      </div>
                    </div>

                    {/* New Comment Form */}
                    <div className="space-y-3">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={
                          commentType === 'internal' 
                            ? "Add an internal note for the team..." 
                            : "Write a message for the client..."
                        }
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Paperclip className="w-4 h-4" />
                          <span>File attachments coming soon</span>
                        </div>
                        <Button
                          onClick={() => postComment()}
                          disabled={!newComment.trim() || postingComment}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {postingComment ? 'Posting...' : 'Post Comment'}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Comments List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No comments yet</p>
                          <p className="text-sm">Start a conversation with the team or client</p>
                        </div>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.id} className="flex space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-blue-700">
                                {comment.authorName[0]?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {comment.authorName}
                                </p>
                                {comment.authorRole && (
                                  <Badge variant="outline" className="text-xs">
                                    {comment.authorRole}
                                  </Badge>
                                )}
                                {comment.isInternal && (
                                  <Badge variant="secondary" className="text-xs">
                                    Internal
                                  </Badge>
                                )}
                                <p className="text-xs text-gray-500">
                                  {formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">
                                {comment.content}
                              </p>
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="mt-2 flex space-x-2">
                                  {comment.attachments.map((attachment, idx) => (
                                    <a
                                      key={idx}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      {attachment.name}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                {/* Tasks Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Related Tasks
                      </CardTitle>
                      <Badge variant="outline">
                        {booking.tasks?.length || 0} Tasks
                      </Badge>
                    </div>
                    <CardDescription>
                      Manage tasks related to this booking. Create action items and track progress.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* New Task Form */}
                    {canManageBookings && (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                        <Input
                          value={newTask.title}
                          onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Task title..."
                        />
                        <div className="flex items-center space-x-3">
                          <Select 
                            value={newTask.priority} 
                            onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="NORMAL">Normal</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-40"
                          />
                          <Button
                            onClick={createTask}
                            disabled={!newTask.title.trim() || creatingTask}
                            className="ml-auto"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {creatingTask ? 'Creating...' : 'Create Task'}
                          </Button>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Tasks List */}
                    <div className="space-y-3">
                      {!booking.tasks || booking.tasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No tasks yet</p>
                          <p className="text-sm">Create tasks to track work related to this booking</p>
                        </div>
                      ) : (
                        booking.tasks.map(task => (
                          <div key={task.id} className="flex items-center space-x-3 p-3 border rounded-md">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900">{task.title}</p>
                                <Badge 
                                  variant={task.status === 'COMPLETED' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {task.status.replace('_', ' ')}
                                </Badge>
                                {getPriorityBadge(task.priority)}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                {task.assignedTo && (
                                  <span>Assigned to: {task.assignedTo}</span>
                                )}
                                {task.dueDate && (
                                  <span>Due: {formatDate(task.dueDate)}</span>
                                )}
                                <span>Created: {formatDate(task.createdAt)}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/tasks/${task.id}`}>
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                {/* Activity History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Booking History
                    </CardTitle>
                    <CardDescription>
                      Complete timeline of all changes and activities for this booking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Activity tracking coming soon</p>
                      <p className="text-sm">Detailed audit trail will be available here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-700">
                      {(booking.clientName || booking.clientEmail)[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {booking.clientName || 'Unnamed Client'}
                    </h3>
                    {booking.client?.tier && getClientTierBadge(booking.client.tier)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${booking.clientEmail}`} className="text-sm text-blue-600 hover:underline">
                      {booking.clientEmail}
                    </a>
                  </div>

                  {booking.clientPhone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${booking.clientPhone}`} className="text-sm text-blue-600 hover:underline">
                        {booking.clientPhone}
                      </a>
                    </div>
                  )}

                  {booking.client?.company && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{booking.client.company}</span>
                    </div>
                  )}
                </div>

                {booking.client && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Bookings</p>
                        <p className="font-semibold">{booking.client.totalBookings || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Revenue</p>
                        <p className="font-semibold">{formatCurrency(booking.client.totalRevenue)}</p>
                      </div>
                      {booking.client.averageRating && (
                        <div className="col-span-2">
                          <p className="text-gray-600">Average Rating</p>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-semibold">{booking.client.averageRating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/admin/clients/${booking.clientId}`}>
                    View Client Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full">
                  <Bell className="w-4 h-4 mr-2" />
                  Send Reminder
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate Booking
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export Details
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share with Client
                </Button>
              </CardContent>
            </Card>

            {/* Booking Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Booking Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-semibold">{formatDate(booking.createdAt)}</p>
                  </div>
                  {booking.updatedAt && (
                    <div>
                      <p className="text-gray-600">Last Updated</p>
                      <p className="font-semibold">{formatDate(booking.updatedAt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Source</p>
                    <p className="font-semibold">{booking.source || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Payment Status</p>
                    <p className="font-semibold">{booking.paymentStatus || 'Pending'}</p>
                  </div>
                </div>

                {booking.reminderSent && (
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-md">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">Reminder sent</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}