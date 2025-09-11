import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'
import prisma from '@/lib/prisma'

// Shared projection to normalize DB to API shape
interface DbMemberStats { totalBookings?: number; completedBookings?: number; averageRating?: number; totalRatings?: number; revenueGenerated?: number; utilizationRate?: number }
interface DbWorkingHours { start?: string; end?: string; timezone?: string; days?: string[] }
interface DbMember { id: string; userId?: string | null; name: string; email: string; role?: string; department: string; status?: string; title: string; certifications?: string[]; specialties?: string[]; experienceYears?: number | null; hourlyRate?: number | null; workingHours?: DbWorkingHours | null; isAvailable?: boolean; availabilityNotes?: string | null; stats?: DbMemberStats | null; canManageBookings?: boolean; canViewAllClients?: boolean; notificationSettings?: { email?: boolean; sms?: boolean; inApp?: boolean } | null; joinDate?: string | Date; lastActive?: string | Date; notes?: string | null; phone?: string | null }
function mapDbMember(m: DbMember) {
  const stats = m.stats || {}
  return {
    id: m.id,
    userId: m.userId || null,
    name: m.name,
    email: m.email,
    role: m.role,
    department: m.department,
    status: m.status,
    title: m.title,
    certifications: m.certifications || [],
    specialties: m.specialties || [],
    experienceYears: Number(m.experienceYears || 0),
    hourlyRate: m.hourlyRate != null ? Number(m.hourlyRate) : undefined,
    workingHours: m.workingHours || { start: '09:00', end: '17:00', timezone: 'Africa/Cairo', days: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
    isAvailable: Boolean(m.isAvailable ?? m.status === 'active'),
    availabilityNotes: m.availabilityNotes || undefined,
    stats: {
      totalBookings: Number(stats.totalBookings || 0),
      completedBookings: Number(stats.completedBookings || 0),
      averageRating: Number(stats.averageRating || 0),
      totalRatings: Number(stats.totalRatings || 0),
      revenueGenerated: Number(stats.revenueGenerated || 0),
      utilizationRate: Number(stats.utilizationRate || 0)
    },
    canManageBookings: Boolean(m.canManageBookings),
    canViewAllClients: Boolean(m.canViewAllClients),
    notificationSettings: m.notificationSettings || { email: true, sms: false, inApp: true },
    joinDate: (m.joinDate instanceof Date ? m.joinDate.toISOString() : (m.joinDate || new Date().toISOString())),
    lastActive: (m.lastActive instanceof Date ? m.lastActive.toISOString() : (m.lastActive || new Date().toISOString())),
    notes: m.notes || undefined,
    phone: m.phone || undefined,
  }
}

const fallbackMembers = [
  mapDbMember({
    id: 'tm1', userId: 'user1', name: 'John Smith', email: 'john.smith@firm.com', role: 'STAFF', department: 'tax', status: 'active', title: 'Senior Tax Advisor', certifications: ['CPA','Tax Specialist'], specialties: ['Corporate Tax','International Tax','Tax Planning'], experienceYears: 8, hourlyRate: 150, workingHours: { start:'09:00', end:'17:00', timezone:'Africa/Cairo', days:['Monday','Tuesday','Wednesday','Thursday','Friday'] }, isAvailable: true, stats: { totalBookings:156, completedBookings:148, averageRating:4.8, totalRatings:89, revenueGenerated:45600, utilizationRate:87 }, canManageBookings: true, canViewAllClients: true, notificationSettings: { email:true, sms:false, inApp:true }, joinDate: '2023-01-15', lastActive: '2025-09-11T08:30:00Z' }),
  mapDbMember({
    id: 'tm2', userId: 'user2', name: 'Jane Doe', email: 'jane.doe@firm.com', role: 'STAFF', department: 'audit', status: 'active', title: 'Audit Manager', certifications: ['CPA','CIA'], specialties: ['Financial Audit','Compliance Review','Risk Assessment'], experienceYears: 10, hourlyRate: 175, workingHours: { start:'08:30', end:'16:30', timezone:'Africa/Cairo', days:['Monday','Tuesday','Wednesday','Thursday','Friday'] }, isAvailable: true, stats: { totalBookings:89, completedBookings:85, averageRating:4.9, totalRatings:67, revenueGenerated:52300, utilizationRate:92 }, canManageBookings: true, canViewAllClients: false, notificationSettings: { email:true, sms:true, inApp:true }, joinDate: '2022-09-01', lastActive: '2025-09-11T09:15:00Z' }),
]

export async function GET(request: NextRequest) {
  void request
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, 'manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const members = await prisma.teamMember.findMany({
        include: { stats: true },
        orderBy: { joinDate: 'desc' }
      })
      return NextResponse.json({ teamMembers: members.map(mapDbMember) })
    } catch (_err) {
      // Table may not exist yet or DB not configured
      return NextResponse.json({ teamMembers: fallbackMembers })
    }
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, 'manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      userId,
      name,
      email,
      phone,
      role,
      department,
      title,
      specialties = [],
      certifications = [],
      experienceYears = 0,
      hourlyRate,
      workingHours = { start: '09:00', end: '17:00', timezone: 'Africa/Cairo', days: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
      canManageBookings = false,
      canViewAllClients = false,
      notificationSettings = { email: true, sms: false, inApp: true },
      notes
    } = body || {}

    if (!name || !email || !department || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    try {
      const created = await prisma.teamMember.create({
        data: {
          userId: userId || null,
          name,
          email,
          phone,
          role: role || 'STAFF',
          department,
          title,
          status: 'active',
          experienceYears: Number(experienceYears || 0),
          hourlyRate: hourlyRate != null ? Number(hourlyRate) : null,
          specialties,
          certifications,
          workingHours,
          isAvailable: true,
          canManageBookings,
          canViewAllClients,
          notificationSettings,
          availabilityNotes: null,
          notes: notes || null,
          joinDate: new Date(),
          lastActive: new Date(),
          stats: { create: { totalBookings: 0, completedBookings: 0, averageRating: 0, totalRatings: 0, revenueGenerated: 0, utilizationRate: 0 } }
        },
        include: { stats: true }
      })
      return NextResponse.json({ teamMember: mapDbMember(created) }, { status: 201 })
    } catch (_err) {
      // DB not ready: respond with echo payload
      const echo = mapDbMember({ id: `tm-${Date.now()}`, userId, name, email, phone, role: role || 'STAFF', department, title, status: 'active', experienceYears, hourlyRate, specialties, certifications, workingHours, isAvailable: true, canManageBookings, canViewAllClients, notificationSettings, availabilityNotes: null, notes, joinDate: new Date().toISOString(), lastActive: new Date().toISOString(), stats: {} })
      return NextResponse.json({ teamMember: echo, warning: 'DB not available, returned non-persistent item' }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
