'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Users,
  DollarSign,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Save,
  Edit3,
  Plus,
  MessageSquare,
  AlertCircle,
  FileText,
  MapPin,
  Globe,
  Building,
  Star,
  History,
  Send,
  RefreshCw,
  Eye,
} from 'lucide-react'

interface ServiceLite {
  id: string
  name: string
  price?: number | string | null
  duration?: number | null
  category?: string | null
  slug?: string | null
}

interface ClientLite {
  id?: string
  name?: string | null
  email: string
  phone?: string | null
  _count?: { bookings?: number }
}

interface AdminNote {
  id: number
  text: string
  createdAt: string
  createdBy: string
  userName: string
  priority?: 'normal' | 'high' | 'urgent'
  category?: 'general' | 'follow-up' | 'issue' | 'billing'
}

interface BookingDetail {
  id: string
  clientId?: string
  serviceId?: string
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
  createdAt?: string
  updatedAt?: string
  assignedTeamMember?: { id: string; name: string; email: string }
  service: ServiceLite
  client: ClientLite
  location?: 'office' | 'remote' | 'client_site'
  meetingLink?: string
  onSiteAddress?: string
  priority?: 'normal' | 'high' | 'urgent'
  paymentStatus?: 'pending' | 'paid' | 'refunded'
}

interface TeamMemberLite { 
  id: string
  name: string
  email: string
  specialties?: string[]
  availability?: 'available' | 'busy' | 'offline'
}

export default function EnhancedAdminBookingDetailPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params?.id

  const isEditMode = (searchParams?.get('edit') === '1')

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit state
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editLocation, setEditLocation] = useState<'office' | 'remote' | 'client_site'>('office')
  const [savingChanges, setSavingChanges] = useState(false)

  // Admin notes state
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([])
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [newNoteCategory, setNewNoteCategory] = useState<'general' | 'follow-up' | 'issue' | 'billing'>('general')
  const [newNotePriority, setNewNotePriority] = useState<'normal' | 'high' | 'urgent'>('normal')
  const [currentUserName, setCurrentUserName] = useState('Admin User')
  const [addingNote, setAddingNote] = useState(false)

  // Status and team
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMemberLite[]>([])

  // Local-only UI state
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'refunded'>('pending')

  // Documents state
  const [docFiles, setDocFiles] = useState<File[]>([])
  const [docs, setDocs] = useState<{ name: string; size: number; type: string; url?: string }[]>([])
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await apiFetch(`/api/bookings/${id}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (!ignore) {
            setError(body?.error || `Failed to load (${res.status})`)
            setBooking(null)
          }
          return
        }
        const data = await res.json()
        if (ignore) return

        setBooking(data)
        setPaymentStatus(data?.paymentStatus || 'pending')

        // Parse admin notes JSON -> array
        try {
          const notes = data?.adminNotes ? JSON.parse(data.adminNotes) : []
          setAdminNotes(Array.isArray(notes) ? notes : [])
        } catch {
          setAdminNotes([])
        }

        // Initialize edit fields
        try {
          const d = new Date(data?.scheduledAt)
          const iso = d.toISOString()
          setEditDate(iso.split('T')[0])
          setEditTime(new Date(d).toISOString().split('T')[1].slice(0,5))
        } catch {}

        try {
          const pRaw = data?.service?.price as unknown
          const pNum = typeof pRaw === 'string' ? parseFloat(pRaw) : typeof pRaw === 'number' ? pRaw : 0
          setEditPrice(Number.isFinite(pNum) && pNum > 0 ? String(pNum) : '')
        } catch {}

        setEditLocation(data?.location || 'office')
      } catch {
        if (!ignore) setError('Could not fetch booking')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()

    // Try to load existing documents (will be 501 until storage configured)
    ;(async () => {
      if (!id) return
      try {
        const res = await fetch(`/api/bookings/${id}/documents`)
        if (res.ok) {
          const list = await res.json().catch(() => ([])) as { name?: string; size?: number; type?: string; url?: string }[]
          if (Array.isArray(list)) setDocs(list.filter(d => d && d.name).map(d => ({ name: String(d.name), size: Number(d.size||0), type: String(d.type||'application/octet-stream'), url: d.url })))
        } else if (res.status === 501) {
          setDocsError('Document storage not configured')
        }
      } catch {
        setDocsError('Unable to load documents')
      }
    })()

    // Load team members for assignment
    ;(async () => {
      try {
        const res = await apiFetch('/api/admin/team-members')
        const json = await res.json().catch(() => ({}))
        const list: TeamMemberLite[] = Array.isArray(json?.teamMembers) ? json.teamMembers : []
        if (!ignore) setTeamMembers(list)
      } catch {
        if (!ignore) setTeamMembers([])
      }
    })()

    return () => { ignore = true }
  }, [id])

  // Current user display name
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch('/api/users/me')
        if (!res.ok) return
        const j = await res.json().catch(() => ({}))
        if (!cancelled) setCurrentUserName(j?.user?.name || j?.user?.email || 'Admin User')
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  })

  const statusBadge = useMemo(() => {
    switch (booking?.status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'NO_SHOW': return 'bg-gray-100 text-gray-800'
      case 'PENDING':
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }, [booking?.status])

  async function updateStatus(next: 'CONFIRMED'|'COMPLETED'|'CANCELLED') {
    if (!booking) return
    setUpdatingStatus(next)
    try {
      const res = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: next, 
          confirmed: next === 'CONFIRMED' ? true : undefined 
        })
      })
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body?.error || `Failed to update (${res.status})`)
      }
    } catch {
      setError('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  async function saveChanges() {
    if (!booking) return
    setSavingChanges(true)
    try {
      const updates: Record<string, unknown> = {}

      // Schedule
      if (editDate && editTime) {
        const scheduledAt = new Date(`${editDate}T${editTime}:00`)
        updates.scheduledAt = scheduledAt.toISOString()
      }
      // Location
      if (editLocation !== booking.location) {
        updates.location = editLocation
      }

      if (Object.keys(updates).length > 0) {
        const res = await apiFetch(`/api/bookings/${booking.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })
        if (res.ok) {
          const data = await res.json()
          setBooking({ ...booking, ...updates })
        }
      }

      // Optionally update service price if slug is available
      if (booking.service?.slug && editPrice !== '' && parseFloat(editPrice) !== Number(booking.service.price || 0)) {
        const priceNum = parseFloat(editPrice)
        if (Number.isFinite(priceNum)) {
          await apiFetch(`/api/services/${booking.service.slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: priceNum })
          })
          setBooking(prev => prev ? { ...prev, service: { ...prev.service, price: priceNum } } : null)
        }
      }

      router.replace(`/admin/bookings/${booking.id}`)
    } catch {
      setError('Failed to save changes')
    } finally {
      setSavingChanges(false)
    }
  }

  async function addNote() {
    if (!booking || !newNote.trim()) return
    setAddingNote(true)
    try {
      const note: AdminNote = {
        id: Date.now(),
        text: newNote.trim(),
        createdAt: new Date().toISOString(),
        createdBy: currentUserName,
        userName: currentUserName,
        priority: newNotePriority,
        category: newNoteCategory
      }
      const updatedNotes = [...adminNotes, note]
      const res = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: JSON.stringify(updatedNotes) })
      })
      if (res.ok) {
        setAdminNotes(updatedNotes)
        setNewNote('')
        setShowNoteForm(false)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body?.error || 'Failed to save note')
      }
    } catch {
      setError('Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  async function updateAssignment(memberId: string | '') {
    if (!booking) return
    try {
      const res = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTeamMemberId: memberId || null })
      })
      if (res.ok) {
        const updated = await res.json()
        setBooking(updated)
      }
    } catch {
      // ignore
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'follow-up': return <RefreshCw className="h-3 w-3" />
      case 'issue': return <AlertCircle className="h-3 w-3" />
      case 'billing': return <DollarSign className="h-3 w-3" />
      default: return <MessageSquare className="h-3 w-3" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'follow-up': return 'bg-blue-100 text-blue-800'
      case 'issue': return 'bg-red-100 text-red-800'
      case 'billing': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/bookings"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Unable to load booking</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/bookings"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600">ID: {booking.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditMode && (
              <Button variant="outline" onClick={() => router.push(`/admin/bookings/${booking.id}?edit=1`)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {booking.status !== 'CONFIRMED' && booking.status !== 'CANCELLED' && (
              <Button onClick={() => updateStatus('CONFIRMED')} disabled={!!updatingStatus} className="bg-green-600 hover:bg-green-700">
                {updatingStatus === 'CONFIRMED' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirm
              </Button>
            )}
            {booking.status === 'CONFIRMED' && (
              <Button variant="outline" onClick={() => updateStatus('COMPLETED')} disabled={!!updatingStatus}>
                {updatingStatus === 'COMPLETED' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Mark Complete
              </Button>
            )}
            {booking.status !== 'CANCELLED' && (
              <Button variant="destructive" onClick={() => updateStatus('CANCELLED')} disabled={!!updatingStatus}>
                {updatingStatus === 'CANCELLED' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{booking.service?.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}
                    </CardDescription>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={statusBadge}>{booking.status}</Badge>
                      {booking.priority && booking.priority !== 'normal' && (
                        <Badge>{booking.priority}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{booking.duration} min</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Service & Schedule Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Service Details</h3>
                      <div className="space-y-2">
                        {!isEditMode ? (
                          <>
                            {booking.service?.price != null && (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span>${Number(booking.service.price)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>{formatDate(booking.scheduledAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>{formatTime(booking.scheduledAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {booking.location === 'remote' && <Globe className="h-4 w-4 text-gray-500" />}
                              {booking.location === 'office' && <Building className="h-4 w-4 text-gray-500" />}
                              {booking.location === 'client_site' && <MapPin className="h-4 w-4 text-gray-500" />}
                              <span className="capitalize">{(booking.location || 'office').replace('_', ' ')}</span>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm"
                                placeholder="0.00"
                                step="0.01"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                                <input
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="w-full border rounded px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                                <input
                                  type="time"
                                  value={editTime}
                                  onChange={(e) => setEditTime(e.target.value)}
                                  className="w-full border rounded px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                              <select
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value as 'office' | 'remote' | 'client_site')}
                                className="w-full border rounded px-3 py-2 text-sm"
                              >
                                <option value="office">Office Visit</option>
                                <option value="remote">Remote/Video</option>
                                <option value="client_site">Client Site</option>
                              </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" onClick={saveChanges} disabled={savingChanges}>
                                {savingChanges ? (
                                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 mr-1" />
                                )}
                                Save Changes
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => router.replace(`/admin/bookings/${booking.id}`)}>Cancel</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Staff Assignment */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Assigned Staff</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{booking.assignedTeamMember?.name || 'Unassigned'}</span>
                        </div>

                        {teamMembers.length > 0 && (
                          <Select value={booking.assignedTeamMember?.id ?? 'unassigned'} onValueChange={(v) => updateAssignment(v === 'unassigned' ? '' : v)}>
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Assign staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {teamMembers.map(tm => (
                                <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Client Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{booking.clientName}</span>
                          {booking.client?._count?.bookings && (
                            <Badge variant="secondary" className="text-xs">{booking.client._count.bookings} bookings</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{booking.clientEmail}</span>
                        </div>
                        {booking.clientPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{booking.clientPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Status (local only) */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Payment</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <Badge 
                            variant={
                              paymentStatus === 'paid' ? 'default' : 
                              paymentStatus === 'refunded' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                          </Badge>
                        </div>
                        <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as any)}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Notes */}
                {booking.notes && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-gray-900 mb-2">Client Notes</h3>
                    <div className="p-4 bg-blue-50 rounded-lg text-sm text-gray-700">{booking.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents</CardTitle>
                <CardDescription>Upload and manage related files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {docsError && (
                  <div className="p-3 rounded bg-yellow-50 text-yellow-800 text-sm">{docsError}. Connect storage (e.g., Supabase Storage or Builder CMS assets) to enable uploads.</div>
                )}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input id="file-input" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    const allowed = ['pdf','doc','docx','xls','xlsx']
                    const next: File[] = []
                    for (const f of files) {
                      const ext = f.name.split('.').pop()?.toLowerCase()
                      if (!ext || !allowed.includes(ext)) continue
                      if (f.size > 10 * 1024 * 1024) continue
                      next.push(f)
                    }
                    setDocFiles(prev => [...prev, ...next])
                  }} />
                  <label htmlFor="file-input" className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded text-sm">
                    <FileText className="h-4 w-4" /> Choose Files
                  </label>
                  <div className="text-xs text-gray-500 mt-2">PDF, DOC, XLS up to 10MB each</div>
                </div>

                {docFiles.length > 0 && (
                  <div className="space-y-2">
                    {docFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between border rounded p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{f.name}</span>
                          <span className="text-gray-500">({(f.size/1024/1024).toFixed(2)} MB)</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setDocFiles(prev => prev.filter((_, idx) => idx !== i))}>Remove</Button>
                      </div>
                    ))}
                    <Button onClick={async () => {
                      if (!booking) return
                      setUploadingDocs(true)
                      setDocsError(null)
                      try {
                        const fd = new FormData()
                        docFiles.forEach(f => fd.append('files', f))
                        const res = await fetch(`/api/bookings/${booking.id}/documents`, { method: 'POST', body: fd })
                        if (!res.ok) {
                          const msg = res.status === 501 ? 'Document storage not configured' : 'Upload failed'
                          setDocsError(msg)
                        } else {
                          const uploaded = await res.json().catch(() => []) as { name?: string; size?: number; type?: string; url?: string }[]
                          if (Array.isArray(uploaded) && uploaded.length) setDocs(uploaded.filter(d => d && d.name).map(d => ({ name: String(d.name), size: Number(d.size||0), type: String(d.type||'application/octet-stream'), url: d.url })))
                          setDocFiles([])
                        }
                      } catch {
                        setDocsError('Upload failed')
                      } finally {
                        setUploadingDocs(false)
                      }
                    }} disabled={uploadingDocs} className="gap-2">
                      {uploadingDocs ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {uploadingDocs ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                )}

                {docs.length > 0 && (
                  <div className="space-y-2">
                    {docs.map((d, i) => (
                      <div key={i} className="flex items-center justify-between border rounded p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a href={d.url || '#'} target={d.url ? '_blank' : undefined} rel={d.url ? 'noreferrer' : undefined} className="font-medium text-blue-600 hover:underline">{d.name}</a>
                          <span className="text-gray-500">{(d.size/1024/1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Notes Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Admin Notes</CardTitle>
                    <CardDescription>Internal team communication</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowNoteForm(!showNoteForm)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Note
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showNoteForm && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                          <Select value={newNoteCategory} onValueChange={(v) => setNewNoteCategory(v as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="follow-up">Follow-up</SelectItem>
                              <SelectItem value="issue">Issue</SelectItem>
                              <SelectItem value="billing">Billing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                          <Select value={newNotePriority} onValueChange={(v) => setNewNotePriority(v as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Note</label>
                        <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add your note here..." rows={3} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addNote} disabled={addingNote || !newNote.trim()}>
                          {addingNote ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Add Note
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setShowNoteForm(false); setNewNote('') }}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {adminNotes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No admin notes yet</p>
                      <p className="text-sm">Click "Add Note" to start the conversation</p>
                    </div>
                  ) : (
                    adminNotes
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((note) => (
                        <div key={note.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {getCategoryIcon(note.category || 'general')}
                                <Badge variant="outline" className={`text-xs ${getCategoryColor(note.category || 'general')}`}>
                                  {note.category || 'general'}
                                </Badge>
                              </div>
                              {note.priority && note.priority !== 'normal' && (
                                <Badge variant="outline" className={`text-xs ${getPriorityColor(note.priority)}`}>
                                  {note.priority}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <p className="text-sm text-gray-800 mb-2">{note.text}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            <span>by {note.userName}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Client
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push(`/admin/bookings/${booking.id}?edit=1`)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Create Follow-up
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-xs border-l-2 border-blue-500 pl-3">
                    <p className="font-medium">Booking created</p>
                    <p className="text-gray-500">{booking.createdAt && new Date(booking.createdAt).toLocaleDateString()}</p>
                  </div>
                  {booking.confirmed && (
                    <div className="text-xs border-l-2 border-green-500 pl-3">
                      <p className="font-medium">Booking confirmed</p>
                      <p className="text-gray-500">{booking.updatedAt && new Date(booking.updatedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  {booking.reminderSent && (
                    <div className="text-xs border-l-2 border-yellow-500 pl-3">
                      <p className="font-medium">Reminder sent</p>
                      <p className="text-gray-500">24 hours ago</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{booking.client?._count?.bookings || 0} total bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Regular client</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Payment history: Good</span>
                </div>
                <Button className="w-full mt-4" variant="outline">View Full Profile</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
