# Booking/Service Request Integration Plan

## Executive Summary

This document outlines the comprehensive integration of the Booking module into the existing Service Request system to create a unified workflow. The integration preserves all existing Service Request functionality while adopting Booking's appointment scheduling, availability management, and confirmation workflows.

**Key Integration Approach**: Extend Service Request to include booking-specific fields and workflows rather than merging two separate systems, maintaining the robust RBAC, tenancy, realtime, and audit capabilities already established in Service Requests.

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Phase 1: Data Model Unification](#phase-1-data-model-unification)
3. [Phase 2: API Integration](#phase-2-api-integration)
4. [Phase 3: UI Component Integration](#phase-3-ui-component-integration)
5. [Phase 4: Hooks and State Management](#phase-4-hooks-and-state-management)
6. [Phase 5: Business Logic Integration](#phase-5-business-logic-integration)
7. [Phase 6: Email and Notifications](#phase-6-email-and-notifications)
8. [Phase 7: Testing Integration](#phase-7-testing-integration)
9. [Phase 8: Migration and Deployment](#phase-8-migration-and-deployment)
10. [Phase 9: File Changes Summary](#phase-9-file-changes-summary)
11. [Phase 10: Implementation Timeline](#phase-10-implementation-timeline)
12. [Phase 11: Risk Mitigation](#phase-11-risk-mitigation)
13. [Phase 12: Success Metrics](#phase-12-success-metrics)
14. [Phase 13: Post-Integration Maintenance](#phase-13-post-integration-maintenance)
15. [Phase 14: ServiceMarket-Style Home Page Booking](#phase-14-servicemarket-style-home-page-booking-integration)
16. [Phase 15: Security and Performance Optimization](#phase-15-security-and-performance-optimization)
17. [Phase 16: Accessibility and Internationalization](#phase-16-accessibility-and-internationalization)
18. [Phase 17: Analytics and Business Intelligence](#phase-17-analytics-and-business-intelligence)
19. [Phase 18: Integration Testing and Quality Assurance](#phase-18-integration-testing-and-quality-assurance)

---

## Current State Analysis

### Service Request Module (Target - Mature)
- **Status**: Active, well-architected with comprehensive RBAC, tenancy, realtime, audit logging
- **Strengths**: Standardized API responses, Zod validation, permission gates, realtime updates, multi-tenancy support
- **Coverage**: Admin/Portal UIs, CSV export, analytics, bulk operations, auto-assignment, attachments with AV scanning

### Booking Module (Source - Basic)
- **Status**: Functional but basic architecture
- **Strengths**: Public booking wizard, availability engine, email confirmations, ICS attachments
- **Weaknesses**: No Zod validation, inconsistent API responses, limited RBAC, no multi-tenancy

### Integration Strategy
**Absorption Pattern**: Extend Service Request with booking capabilities rather than maintaining parallel systems. This leverages the mature Service Request architecture while adding scheduling-specific features.

---

## Phase 1: Data Model Unification

### 1.1 Prisma Schema Changes

Extend the existing ServiceRequest model to support booking workflows:

```prisma
model ServiceRequest {
  // Existing fields preserved
  id                    String            @id @default(cuid())
  uuid                  String            @unique @default(uuid())
  clientId              String
  serviceId             String
  title                 String
  description           String?           @db.Text
  priority              RequestPriority   @default(MEDIUM)
  status                RequestStatus     @default(DRAFT)
  budgetMin             Decimal?
  budgetMax             Decimal?
  deadline              DateTime?
  requirements          Json?
  attachments           Json?
  
  // Booking-specific fields (NEW)
  isBooking             Boolean           @default(false)
  scheduledAt           DateTime?
  duration              Int?              // minutes
  clientName            String?           // for guest bookings
  clientEmail           String?           // for guest bookings  
  clientPhone           String?
  confirmed             Boolean           @default(false)
  reminderSent          Boolean           @default(false)
  bookingType           BookingType?      @default(STANDARD)
  recurringPattern      Json?             // for recurring bookings
  parentBookingId       String?           // for recurring bookings
  
  // Existing relations preserved
  client                User              @relation("ServiceRequestClient", fields: [clientId], references: [id])
  service               Service           @relation(fields: [serviceId], references: [id])
  assignedTeamMember    TeamMember?       @relation(fields: [assignedTeamMemberId], references: [id])
  parentBooking         ServiceRequest?   @relation("RecurringBookings", fields: [parentBookingId], references: [id])
  childBookings         ServiceRequest[]  @relation("RecurringBookings")
  
  // Existing audit fields preserved
  assignedTeamMemberId  String?
  assignedAt            DateTime?
  assignedBy            String?
  completedAt           DateTime?
  clientApprovalAt      DateTime?
  tenantId              String?
  
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  
  // Existing relations preserved
  requestTasks          RequestTask[]
  comments              ServiceRequestComment[]
  attachmentsRel        Attachment[]
  
  // Add indexes for booking queries
  @@index([scheduledAt])
  @@index([isBooking, status])
  @@index([tenantId, scheduledAt])
  @@index([tenantId, isBooking, status])
  @@index([clientId, isBooking])
  @@index([assignedTeamMemberId, scheduledAt])
}

// Extend RequestStatus enum for booking-specific statuses
enum RequestStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  // Booking-specific statuses
  PENDING_CONFIRMATION  // booking submitted, awaiting confirmation
  CONFIRMED            // booking confirmed, scheduled
  RESCHEDULED          // booking moved to different time
  NO_SHOW             // client didn't show up for appointment
  PARTIALLY_COMPLETED // service partially completed
}

// Add booking type enum
enum BookingType {
  STANDARD      // One-time booking
  RECURRING     // Recurring booking (weekly, monthly, etc.)
  EMERGENCY     // Urgent/emergency booking
  CONSULTATION  // Consultation/assessment booking
}

// Enhanced Service model for booking support
model Service {
  // Existing fields
  id                    String    @id @default(cuid())
  name                  String
  description           String?   @db.Text
  price                 Decimal
  duration              Int       // minutes
  active                Boolean   @default(true)
  
  // Booking-specific enhancements
  bookingEnabled        Boolean   @default(true)
  advanceBookingDays    Int       @default(30)      // how far in advance can be booked
  minAdvanceHours       Int       @default(24)      // minimum advance notice required
  maxDailyBookings      Int?                        // limit bookings per day
  bufferTime            Int       @default(0)       // minutes between bookings
  businessHours         Json?                       // custom business hours
  blackoutDates         DateTime[]                  // unavailable dates
  
  // Existing relations
  serviceRequests       ServiceRequest[]
  availabilitySlots     AvailabilitySlot[]
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([active, bookingEnabled])
}

// New model for availability management
model AvailabilitySlot {
  id              String    @id @default(cuid())
  serviceId       String
  teamMemberId    String?
  date            DateTime
  startTime       String    // "09:00"
  endTime         String    // "10:00"  
  available       Boolean   @default(true)
  reason          String?   // "Holiday", "Booking", "Break", "Training"
  maxBookings     Int       @default(1)  // how many bookings this slot can handle
  currentBookings Int       @default(0)  // current booking count
  
  service         Service     @relation(fields: [serviceId], references: [id])
  teamMember      TeamMember? @relation(fields: [teamMemberId], references: [id])
  
  @@unique([serviceId, teamMemberId, date, startTime])
  @@index([date, serviceId])
  @@index([teamMemberId, date])
  @@index([available, date])
}

// Enhanced TeamMember model for booking assignments
model TeamMember {
  // Existing fields preserved
  id                    String             @id @default(cuid())
  name                  String
  email                 String?
  userId                String?
  role                  String?
  specialties           String[]
  isAvailable           Boolean            @default(true)
  status                String             @default("ACTIVE")
  
  // Booking-specific fields
  workingHours          Json?              // custom working hours
  timeZone              String?            @default("UTC")
  maxConcurrentBookings Int               @default(3)
  bookingBuffer         Int               @default(15)  // minutes between bookings
  autoAssign            Boolean           @default(true)
  
  // Relations
  serviceRequests       ServiceRequest[]
  availabilitySlots     AvailabilitySlot[]
  
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  
  @@index([isAvailable, status])
  @@index([userId])
}

// Notification preferences for bookings
model BookingPreferences {
  id                    String    @id @default(cuid())
  userId                String    @unique
  
  // Email notifications
  emailConfirmation     Boolean   @default(true)
  emailReminder         Boolean   @default(true)
  emailReschedule       Boolean   @default(true)
  emailCancellation     Boolean   @default(true)
  
  // SMS notifications
  smsReminder           Boolean   @default(false)
  smsConfirmation       Boolean   @default(false)
  
  // Reminder timing
  reminderHours         Int[]     @default([24, 2])  // hours before appointment
  
  // Other preferences
  timeZone              String    @default("UTC")
  preferredLanguage     String    @default("en")
  
  user                  User      @relation(fields: [userId], references: [id])
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

// Add booking preferences relation to User model
model User {
  // Existing fields...
  bookingPreferences    BookingPreferences?
  // Existing relations...
}
```

### 1.2 Migration Strategy

1. **Create migration files in sequence**:
   - `20250920_add_booking_fields/migration.sql` - Add booking fields to ServiceRequest
   - `20250920_enhance_service_model/migration.sql` - Add booking fields to Service
   - `20250920_create_availability_slots/migration.sql` - Create AvailabilitySlot table
   - `20250920_enhance_team_members/migration.sql` - Add booking fields to TeamMember
   - `20250920_create_booking_preferences/migration.sql` - Create BookingPreferences table

2. **Preserve existing data**: All current ServiceRequest records remain unchanged (isBooking defaults to false)

3. **Gradual adoption**: New booking-style requests set isBooking = true

---

## Phase 2: API Integration

### 2.1 Unified API Endpoints

Extend existing Service Request APIs to handle booking workflows:

**Admin API Extensions** (`src/app/api/admin/service-requests/`):

```typescript
// route.ts - Enhanced CREATE to support booking
const CreateServiceRequestSchema = z.discriminatedUnion('isBooking', [
  z.object({
    isBooking: z.literal(false).optional(),
    // Standard service request fields
    clientId: z.string().min(1),
    serviceId: z.string().min(1),
    title: z.string().min(5).max(300),
    description: z.string().optional(),
    priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).default('MEDIUM'),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    deadline: z.string().datetime().optional(),
    requirements: z.record(z.string(), z.any()).optional(),
    attachments: z.any().optional(),
  }),
  z.object({
    isBooking: z.literal(true),
    // Booking-specific fields
    clientId: z.string().optional(), // Optional for guest bookings
    serviceId: z.string().min(1),
    title: z.string().min(5).max(300),
    scheduledAt: z.string().datetime(),
    duration: z.number().min(15).max(480).optional(), // 15 minutes to 8 hours
    clientName: z.string().min(1),
    clientEmail: z.string().email(),
    clientPhone: z.string().optional(),
    bookingType: z.enum(['STANDARD', 'RECURRING', 'EMERGENCY', 'CONSULTATION']).default('STANDARD'),
    recurringPattern: z.object({
      frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
      endDate: z.string().datetime().optional(),
      occurrences: z.number().optional()
    }).optional(),
    requirements: z.record(z.string(), z.any()).optional(),
  })
])

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    
    if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_CREATE)) {
      return respond.unauthorized()
    }
    
    const body = await CreateServiceRequestSchema.parseAsync(await request.json())
    
    // Rate limiting
    await rateLimit(request, 'service-requests:create')
    
    // Tenant isolation
    const tenantId = getTenantFromRequest(request)
    
    // If this is a booking request
    if (body.isBooking) {
      // Validate booking-specific fields
      await validateBookingFields(body, tenantId)
      
      // Check availability conflicts
      const conflicts = await checkAvailabilityConflicts(
        body.serviceId, 
        new Date(body.scheduledAt), 
        body.duration || 60,
        tenantId
      )
      
      if (conflicts.length > 0) {
        return respond.badRequest({
          message: 'Scheduling conflict detected',
          details: conflicts
        })
      }
      
      // Validate business hours and advance booking rules
      await validateBookingTiming(body.serviceId, new Date(body.scheduledAt))
    }
    
    // Create the service request/booking
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        ...body,
        clientId: body.clientId || (session.user as any).id,
        tenantId,
        status: body.isBooking ? 'PENDING_CONFIRMATION' : 'DRAFT',
        scheduledAt: body.isBooking ? new Date(body.scheduledAt) : undefined
      },
      include: {
        client: true,
        service: true,
        assignedTeamMember: true
      }
    })
    
    // Handle recurring bookings
    if (body.isBooking && body.recurringPattern && body.bookingType === 'RECURRING') {
      await createRecurringBookings(serviceRequest.id, body.recurringPattern)
    }
    
    // Auto-assignment for bookings
    if (body.isBooking) {
      await autoAssignBooking(serviceRequest.id)
    } else {
      await autoAssignServiceRequest(serviceRequest.id)
    }
    
    // Send notifications
    if (body.isBooking) {
      await sendBookingConfirmation(serviceRequest)
      // Broadcast to admin dashboard
      realtimeService.broadcast('booking-created', {
        booking: serviceRequest,
        tenantId
      })
    } else {
      realtimeService.broadcast('service-request-created', {
        request: serviceRequest,
        tenantId
      })
    }
    
    // Audit logging
    await logAudit({
      action: body.isBooking ? 'BOOKING_CREATED' : 'SERVICE_REQUEST_CREATED',
      entityId: serviceRequest.id,
      entityType: 'ServiceRequest',
      userId: (session.user as any).id,
      details: { 
        isBooking: body.isBooking,
        service: serviceRequest.service.name,
        scheduledAt: serviceRequest.scheduledAt 
      },
      tenantId
    })
    
    return respond.created(serviceRequest)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest({
        message: 'Validation failed',
        details: zodDetails(error)
      })
    }
    
    await captureError(error)
    return respond.internalError()
  }
}

// Enhanced GET to support booking filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    
    if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
      return respond.unauthorized()
    }
    
    const { searchParams } = new URL(request.url)
    const tenantId = getTenantFromRequest(request)
    
    // Parse query parameters
    const filters = {
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20'))),
      status: searchParams.get('status')?.split(',') as RequestStatus[] || undefined,
      priority: searchParams.get('priority')?.split(',') as RequestPriority[] || undefined,
      isBooking: searchParams.get('isBooking') === 'true' ? true : 
                 searchParams.get('isBooking') === 'false' ? false : undefined,
      bookingType: searchParams.get('bookingType') as BookingType || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      serviceId: searchParams.get('serviceId') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      q: searchParams.get('q') || undefined
    }
    
    const skip = (filters.page - 1) * filters.limit
    
    // Build where clause
    const where: any = {
      ...(tenantId && isMultiTenancyEnabled() ? { tenantId } : {}),
      ...(filters.status ? { status: { in: filters.status } } : {}),
      ...(filters.priority ? { priority: { in: filters.priority } } : {}),
      ...(filters.isBooking !== undefined ? { isBooking: filters.isBooking } : {}),
      ...(filters.bookingType ? { bookingType: filters.bookingType } : {}),
      ...(filters.assignedTo ? { assignedTeamMemberId: filters.assignedTo } : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
      ...(filters.dateFrom || filters.dateTo ? {
        scheduledAt: {
          ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
          ...(filters.dateTo ? { lte: filters.dateTo } : {})
        }
      } : {}),
      ...(filters.q ? {
        OR: [
          { title: { contains: filters.q, mode: 'insensitive' } },
          { description: { contains: filters.q, mode: 'insensitive' } },
          { clientName: { contains: filters.q, mode: 'insensitive' } },
          { clientEmail: { contains: filters.q, mode: 'insensitive' } },
          { client: { name: { contains: filters.q, mode: 'insensitive' } } }
        ]
      } : {})
    }
    
    // Execute queries
    const [serviceRequests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: [
          { scheduledAt: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          client: {
            select: { id: true, name: true, email: true }
          },
          service: {
            select: { id: true, name: true, price: true, duration: true }
          },
          assignedTeamMember: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.serviceRequest.count({ where })
    ])
    
    return respond.ok({
      data: serviceRequests,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      }
    })
    
  } catch (error) {
    await captureError(error)
    return respond.internalError()
  }
}
```

**New Booking-Specific Endpoints**:

```typescript
// availability/route.ts - New endpoint for availability checking
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')
    const days = parseInt(searchParams.get('days') || '7')
    const teamMemberId = searchParams.get('teamMemberId')
    
    if (!serviceId) {
      return respond.badRequest({ message: 'Service ID is required' })
    }
    
    const tenantId = getTenantFromRequest(request)
    const startDate = date ? new Date(date) : new Date()
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days)
    
    const availability = await getAvailabilitySlots({
      serviceId,
      startDate,
      endDate,
      teamMemberId,
      tenantId
    })
    
    return respond.ok({
      serviceId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      availability
    })
    
  } catch (error) {
    await captureError(error)
    return respond.internalError()
  }
}

// [id]/confirm/route.ts - New booking confirmation endpoint  
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session?.user) {
      return respond.unauthorized()
    }
    
    const role = (session.user as any)?.role
    if (!hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
      return respond.forbidden()
    }
    
    const tenantId = getTenantFromRequest(request)
    
    // Find the booking
    const booking = await prisma.serviceRequest.findFirst({
      where: {
        id,
        isBooking: true,
        ...(tenantId && isMultiTenancyEnabled() ? { tenantId } : {})
      },
      include: {
        client: true,
        service: true,
        assignedTeamMember: true
      }
    })
    
    if (!booking) {
      return respond.notFound({ message: 'Booking not found' })
    }
    
    if (booking.status === 'CONFIRMED') {
      return respond.badRequest({ message: 'Booking is already confirmed' })
    }
    
    // Confirm the booking
    const updatedBooking = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmed: true
      },
      include: {
        client: true,
        service: true,
        assignedTeamMember: true
      }
    })
    
    // Send confirmation email with ICS attachment
    await sendBookingConfirmation(updatedBooking)
    
    // Broadcast realtime update
    realtimeService.broadcast('booking-confirmed', {
      booking: updatedBooking,
      tenantId
    })
    
    // Audit log
    await logAudit({
      action: 'BOOKING_CONFIRMED',
      entityId: id,
      entityType: 'ServiceRequest',
      userId: (session.user as any).id,
      details: { 
        bookingTitle: updatedBooking.title,
        scheduledAt: updatedBooking.scheduledAt,
        clientEmail: updatedBooking.clientEmail 
      },
      tenantId
    })
    
    return respond.ok({ 
      booking: updatedBooking,
      confirmed: true 
    })
    
  } catch (error) {
    await captureError(error)
    return respond.internalError()
  }
}

// [id]/reschedule/route.ts - New booking reschedule endpoint
const RescheduleSchema = z.object({
  scheduledAt: z.string().datetime(),
  reason: z.string().optional()
})

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session?.user) {
      return respond.unauthorized()
    }
    
    const body = await RescheduleSchema.parseAsync(await request.json())
    const tenantId = getTenantFromRequest(request)
    
    // Find the booking
    const booking = await prisma.serviceRequest.findFirst({
      where: {
        id,
        isBooking: true,
        ...(tenantId && isMultiTenancyEnabled() ? { tenantId } : {})
      },
      include: { service: true }
    })
    
    if (!booking) {
      return respond.notFound({ message: 'Booking not found' })
    }
    
    const newScheduledAt = new Date(body.scheduledAt)
    
    // Check if user can reschedule (business rules)
    const canReschedule = await canUserRescheduleBooking(booking, session.user, newScheduledAt)
    if (!canReschedule.allowed) {
      return respond.badRequest({ message: canReschedule.reason })
    }
    
    // Check availability conflicts
    const conflicts = await checkAvailabilityConflicts(
      booking.serviceId, 
      newScheduledAt, 
      booking.duration || booking.service.duration,
      tenantId,
      id // exclude current booking
    )
    
    if (conflicts.length > 0) {
      return respond.badRequest({
        message: 'New time slot is not available',
        details: conflicts
      })
    }
    
    // Update the booking
    const updatedBooking = await prisma.serviceRequest.update({
      where: { id },
      data: {
        scheduledAt: newScheduledAt,
        status: 'RESCHEDULED',
        reminderSent: false // Reset reminder flag
      },
      include: {
        client: true,
        service: true,
        assignedTeamMember: true
      }
    })
    
    // Send reschedule notification
    await sendBookingRescheduleNotification(updatedBooking, body.reason)
    
    // Broadcast update
    realtimeService.broadcast('booking-rescheduled', {
      booking: updatedBooking,
      tenantId
    })
    
    // Audit log
    await logAudit({
      action: 'BOOKING_RESCHEDULED',
      entityId: id,
      entityType: 'ServiceRequest',
      userId: (session.user as any).id,
      details: {
        oldTime: booking.scheduledAt,
        newTime: newScheduledAt,
        reason: body.reason
      },
      tenantId
    })
    
    return respond.ok(updatedBooking)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest({
        message: 'Validation failed',
        details: zodDetails(error)
      })
    }
    
    await captureError(error)
    return respond.internalError()
  }
}
```

### 2.2 Portal API Extensions

```typescript
// src/app/api/portal/service-requests/route.ts (enhanced)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const tenantId = getTenantFromRequest(request)
    
    // Support guest bookings (no authentication required)
    const isGuestBooking = !session?.user && body.isBooking
    
    if (!isGuestBooking && !session?.user) {
      return respond.unauthorized()
    }
    
    // Rate limiting (stricter for guest bookings)
    const rateLimitKey = isGuestBooking ? 
      `guest-booking:${body.clientEmail}` : 
      `portal:service-requests:${(session!.user as any).id}`
    
    await rateLimit(request, rateLimitKey, {
      maxRequests: isGuestBooking ? 3 : 10,
      windowMs: 60 * 60 * 1000 // 1 hour
    })
    
    if (body.isBooking) {
      // Validate booking creation
      const bookingData = await BookingServiceRequestSchema.parseAsync(body)
      
      // For guest bookings, create or find user by email
      let clientId = bookingData.clientId
      if (isGuestBooking) {
        const existingUser = await prisma.user.findUnique({
          where: { email: bookingData.clientEmail }
        })
        
        if (existingUser) {
          clientId = existingUser.id
        } else {
          // Create guest user
          const guestUser = await prisma.user.create({
            data: {
              email: bookingData.clientEmail,
              name: bookingData.clientName,
              role: 'CLIENT',
              tenantId
            }
          })
          clientId = guestUser.id
        }
      }
      
      // Check service availability
      const service = await prisma.service.findFirst({
        where: {
          id: bookingData.serviceId,
          active: true,
          bookingEnabled: true,
          ...(tenantId && isMultiTenancyEnabled() ? { tenantId } : {})
        }
      })
      
      if (!service) {
        return respond.badRequest({ message: 'Service not available for booking' })
      }
      
      // Validate booking timing
      await validateBookingTiming(service.id, new Date(bookingData.scheduledAt))
      
      // Check conflicts
      const conflicts = await checkAvailabilityConflicts(
        service.id,
        new Date(bookingData.scheduledAt),
        bookingData.duration || service.duration,
        tenantId
      )
      
      if (conflicts.length > 0) {
        return respond.badRequest({
          message: 'Time slot not available',
          details: conflicts
        })
      }
      
      // Create the booking
      const booking = await prisma.serviceRequest.create({
        data: {
          clientId,
          serviceId: bookingData.serviceId,
          title: `${service.name} - ${bookingData.clientName}`,
          description: bookingData.requirements ? JSON.stringify(bookingData.requirements) : undefined,
          isBooking: true,
          scheduledAt: new Date(bookingData.scheduledAt),
          duration: bookingData.duration || service.duration,
          clientName: bookingData.clientName,
          clientEmail: bookingData.clientEmail,
          clientPhone: bookingData.clientPhone,
          bookingType: bookingData.bookingType || 'STANDARD',
          status: 'PENDING_CONFIRMATION',
          priority: 'MEDIUM',
          tenantId
        },
        include: {
          client: true,
          service: true
        }
      })
      
      // Auto-assign if possible
      await autoAssignBooking(booking.id)
      
      // Send confirmation email
      await sendBookingConfirmation(booking)
      
      // Create recurring bookings if needed
      if (bookingData.recurringPattern && bookingData.bookingType === 'RECURRING') {
        await createRecurringBookings(booking.id, bookingData.recurringPattern)
      }
      
      return respond.created(booking)
      
    } else {
      // Handle regular service request creation
      if (!session?.user) {
        return respond.unauthorized()
      }
      
      const serviceRequest = await createServiceRequest(body, session.user, tenantId)
      return respond.created(serviceRequest)
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest({
        message: 'Validation failed',
        details: zodDetails(error)
      })
    }
    
    await captureError(error)
    return respond.internalError()
  }
}
```

### 2.3 Backward Compatibility Layer

Maintain existing Booking endpoints as aliases during transition:

```typescript
// src/app/api/bookings/route.ts (compatibility layer)
import { NextRequest } from 'next/server'
import { respond } from '@/lib/api-response'

// Add deprecation warning to response headers
function addDeprecationWarning(response: Response) {
  response.headers.set('X-API-Deprecated', 'true')
  response.headers.set('X-API-Deprecation-Date', '2025-12-31')
  response.headers.set('X-API-Migration-Guide', '/docs/api-migration')
  return response
}

export async function GET(request: NextRequest) {
  // Forward to unified service-requests endpoint with booking filter
  const url = new URL(request.url)
  url.pathname = '/api/admin/service-requests'
  url.searchParams.set('isBooking', 'true')
  
  const response = await fetch(url, {
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'X-Forwarded-From': '/api/bookings'
    }
  })
  
  return addDeprecationWarning(response)
}

export async function POST(request: NextRequest) {
  const bookingData = await request.json()
  
  // Transform booking payload to service request format
  const serviceRequestData = {
    ...bookingData,
    isBooking: true,
    title: bookingData.title || `${bookingData.service?.name || 'Service'} - ${bookingData.clientName}`,
    status: 'PENDING_CONFIRMATION'
  }
  
  const response = await fetch(new URL('/api/portal/service-requests', request.url), {
    method: 'POST',
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'Content-Type': 'application/json',
      'X-Forwarded-From': '/api/bookings'
    },
    body: JSON.stringify(serviceRequestData)
  })
  
  return addDeprecationWarning(response)
}

// src/app/api/bookings/availability/route.ts (compatibility)
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  url.pathname = '/api/admin/service-requests/availability'
  
  const response = await fetch(url, {
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'X-Forwarded-From': '/api/bookings/availability'
    }
  })
  
  return addDeprecationWarning(response)
}

// src/app/api/bookings/[id]/route.ts (compatibility)
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params
  const url = new URL(request.url)
  url.pathname = `/api/admin/service-requests/${id}`
  
  const response = await fetch(url, {
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'X-Forwarded-From': `/api/bookings/${id}`
    }
  })
  
  return addDeprecationWarning(response)
}
```

---

## Phase 3: UI Component Integration

### 3.1 Admin UI Consolidation

**Enhanced Admin Service Requests List:**

```typescript
// src/app/admin/service-requests/page.tsx (enhanced)
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { ServiceRequestsTable } from '@/components/admin/service-requests/table'
import { ServiceRequestsFilters } from '@/components/admin/service-requests/filters'
import { ServiceRequestsBulkActions } from '@/components/admin/service-requests/bulk-actions'
import { ServiceRequestsOverview } from '@/components/admin/service-requests/overview'
import { BookingCalendarView } from '@/components/admin/service-requests/booking-calendar-view'
import { useServiceRequests } from '@/hooks/useServiceRequests'
import { useRealtime } from '@/hooks/useRealtime'
import { hasPermission } from '@/lib/permissions'
import { usePermissions } from '@/lib/use-permissions'

type ViewType = 'all' | 'requests' | 'bookings'
type DisplayMode = 'list' | 'calendar' | 'analytics'

export default function AdminServiceRequestsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { has } = usePermissions()
  
  const [viewType, setViewType] = useState<ViewType>('all')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filters, setFilters] = useState({
    status: searchParams.get('status')?.split(',') || [],
    priority: searchParams.get('priority')?.split(',') || [],
    assignedTo: searchParams.get('assignedTo') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    q: searchParams.get('q') || ''
  })
  
  const {
    data: serviceRequests,
    loading,
    error,
    pagination,
    refresh
  } = useServiceRequests({
    type: viewType,
    ...filters,
    page: parseInt(searchParams.get('page') || '1')
  })
  
  // Realtime updates
  useRealtime([
    'service-request-created',
    'service-request-updated', 
    'booking-created',
    'booking-confirmed',
    'booking-rescheduled'
  ], () => {
    refresh()
  })
  
  const handleViewTypeChange = (type: ViewType) => {
    setViewType(type)
    setSelectedItems([])
    
    // Update URL
    const params = new URLSearchParams(searchParams)
    if (type !== 'all') {
      params.set('type', type)
    } else {
      params.delete('type')
    }
    router.push(`?${params.toString()}`)
  }
  
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    
    // Update URL with filters
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, Array.isArray(value) ? value.join(',') : String(value))
      }
    })
    router.push(`?${params.toString()}`)
  }
  
  const bookingStats = serviceRequests?.filter(r => r.isBooking) || []
  const requestStats = serviceRequests?.filter(r => !r.isBooking) || []
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Requests & Bookings</h1>
          <p className="text-muted-foreground">
            Manage client requests and appointments
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Display Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={displayMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisplayMode('list')}
            >
              List
            </Button>
            <Button
              variant={displayMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisplayMode('calendar')}
              disabled={viewType === 'requests'}
            >
              Calendar
            </Button>
            <Button
              variant={displayMode === 'analytics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisplayMode('analytics')}
            >
              Analytics
            </Button>
          </div>
          
          {has('SERVICE_REQUESTS_CREATE') && (
            <Button asChild>
              <a href="/admin/service-requests/new">
                New Request
              </a>
            </Button>
          )}
        </div>
      </div>
      
      {/* Overview Stats */}
      <ServiceRequestsOverview 
        data={serviceRequests}
        bookingStats={bookingStats}
        requestStats={requestStats}
      />
      
      {/* View Type Tabs */}
      <Tabs value={viewType} onValueChange={handleViewTypeChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" className="relative">
              All
              {serviceRequests && (
                <Badge variant="secondary" className="ml-2">
                  {serviceRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Service Requests
              {requestStats && (
                <Badge variant="secondary" className="ml-2">
                  {requestStats.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings" className="relative">
              Appointments
              {bookingStats && (
                <Badge variant="secondary" className="ml-2">
                  {bookingStats.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <ServiceRequestsBulkActions
              selectedItems={selectedItems}
              onComplete={() => {
                setSelectedItems([])
                refresh()
              }}
            />
          )}
        </div>
        
        {/* Filters */}
        <ServiceRequestsFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
          viewType={viewType}
        />
        
        {/* Content Views */}
        <TabsContent value="all" className="space-y-4">
          {displayMode === 'list' && (
            <ServiceRequestsTable
              data={serviceRequests || []}
              loading={loading}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              viewType="all"
            />
          )}
          
          {displayMode === 'calendar' && (
            <BookingCalendarView
              bookings={bookingStats}
              onBookingSelect={(booking) => {
                router.push(`/admin/service-requests/${booking.id}`)
              }}
            />
          )}
          
          {displayMode === 'analytics' && (
            <ServiceRequestsAnalytics
              requests={requestStats}
              bookings={bookingStats}
            />
          )}
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4">
          <ServiceRequestsTable
            data={requestStats}
            loading={loading}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            viewType="requests"
          />
        </TabsContent>
        
        <TabsContent value="bookings" className="space-y-4">
          {displayMode === 'list' && (
            <ServiceRequestsTable
              data={bookingStats}
              loading={loading}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              viewType="bookings"
            />
          )}
          
          {displayMode === 'calendar' && (
            <BookingCalendarView
              bookings={bookingStats}
              onBookingSelect={(booking) => {
                router.push(`/admin/service-requests/${booking.id}`)
              }}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                params.set('page', String(pagination.page - 1))
                router.push(`?${params.toString()}`)
              }}
            >
              Previous
            </Button>
            
            <div className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                params.set('page', String(pagination.page + 1))
                router.push(`?${params.toString()}`)
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Enhanced Service Requests Table:**

```typescript
// src/components/admin/service-requests/table.tsx (enhanced)
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ServiceRequestStatusBadge } from './status-badge'
import { BookingActions } from './booking-actions'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontal, Calendar, User, Clock } from 'lucide-react'

interface ServiceRequestsTableProps {
  data: any[]
  loading: boolean
  selectedItems: string[]
  onSelectionChange: (items: string[]) => void
  viewType: 'all' | 'requests' | 'bookings'
}

export function ServiceRequestsTable({
  data,
  loading,
  selectedItems,
  onSelectionChange,
  viewType
}: ServiceRequestsTableProps) {
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map(item => item.id))
    } else {
      onSelectionChange([])
    }
  }
  
  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, id])
    } else {
      onSelectionChange(selectedItems.filter(item => item !== id))
    }
  }
  
  const isAllSelected = data.length > 0 && selectedItems.length === data.length
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < data.length
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate
                }}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Client</TableHead>
            {viewType === 'all' && <TableHead>Type</TableHead>}
            {(viewType === 'bookings' || viewType === 'all') && (
              <TableHead>Scheduled</TableHead>
            )}
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                />
              </TableCell>
              
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <a
                    href={`/admin/service-requests/${item.id}`}
                    className="hover:underline"
                  >
                    {item.title}
                  </a>
                  {item.isBooking && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      Booking
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs">
                    {item.description}
                  </p>
                )}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {item.clientName || item.client?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.clientEmail || item.client?.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              {viewType === 'all' && (
                <TableCell>
                  <Badge variant={item.isBooking ? 'default' : 'secondary'}>
                    {item.isBooking ? 'Appointment' : 'Request'}
                  </Badge>
                </TableCell>
              )}
              
              {(viewType === 'bookings' || viewType === 'all') && (
                <TableCell>
                  {item.scheduledAt ? (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {new Date(item.scheduledAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not scheduled</span>
                  )}
                </TableCell>
              )}
              
              <TableCell>
                <ServiceRequestStatusBadge
                  status={item.status}
                  isBooking={item.isBooking}
                />
              </TableCell>
              
              <TableCell>
                <Badge 
                  variant={
                    item.priority === 'URGENT' ? 'destructive' :
                    item.priority === 'HIGH' ? 'default' :
                    'secondary'
                  }
                >
                  {item.priority}
                </Badge>
              </TableCell>
              
              <TableCell>
                {item.assignedTeamMember ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                      {item.assignedTeamMember.name.charAt(0)}
                    </div>
                    <span className="text-sm">{item.assignedTeamMember.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Unassigned</span>
                )}
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  {item.isBooking && (
                    <BookingActions
                      booking={item}
                      onUpdate={() => window.location.reload()}
                    />
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={`/admin/service-requests/${item.id}`}>
                          View Details
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/admin/service-requests/${item.id}/edit`}>
                          Edit
                        </a>
                      </DropdownMenuItem>
                      {item.isBooking && (
                        <>
                          <DropdownMenuItem>
                            Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Send Reminder
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem className="text-destructive">
                        Cancel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
          
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8">
                <div className="text-muted-foreground">
                  No {viewType === 'all' ? 'items' : viewType} found
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 3.2 Enhanced Filters Component

```typescript
// src/components/admin/service-requests/filters.tsx (enhanced)
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, X, Search, Filter } from 'lucide-react'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import { useDebounce } from '@/hooks/useDebounce'

interface FiltersProps {
  filters: {
    status: string[]
    priority: string[]
    assignedTo: string
    dateFrom: string
    dateTo: string
    q: string
  }
  onFiltersChange: (filters: any) => void
  viewType: 'all' | 'requests' | 'bookings'
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  // Booking-specific statuses
  { value: 'PENDING_CONFIRMATION', label: 'Pending Confirmation' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
  { value: 'NO_SHOW', label: 'No Show' }
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' }
]

export function ServiceRequestsFilters({ filters, onFiltersChange, viewType }: FiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.q)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  const { data: teamMembers } = useTeamMembers()
  
  useEffect(() => {
    onFiltersChange({ ...filters, q: debouncedSearch })
  }, [debouncedSearch])
  
  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    
    onFiltersChange({ ...filters, status: newStatus })
  }
  
  const handlePriorityToggle = (priority: string) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority]
    
    onFiltersChange({ ...filters, priority: newPriority })
  }
  
  const clearFilters = () => {
    setSearchQuery('')
    onFiltersChange({
      status: [],
      priority: [],
      assignedTo: '',
      dateFrom: '',
      dateTo: '',
      q: ''
    })
  }
  
  const hasActiveFilters = filters.status.length > 0 || 
                         filters.priority.length > 0 || 
                         filters.assignedTo !== '' || 
                         filters.dateFrom !== '' || 
                         filters.dateTo !== '' || 
                         filters.q !== ''
  
  // Filter status options based on view type
  const relevantStatuses = STATUS_OPTIONS.filter(status => {
    if (viewType === 'requests') {
      return !['PENDING_CONFIRMATION', 'CONFIRMED', 'RESCHEDULED', 'NO_SHOW'].includes(status.value)
    }
    if (viewType === 'bookings') {
      return ['PENDING_CONFIRMATION', 'CONFIRMED', 'RESCHEDULED', 'NO_SHOW', 'COMPLETED', 'CANCELLED'].includes(status.value)
    }
    return true // all statuses for 'all' view
  })
  
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      {/* Search and Quick Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests, clients, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="shrink-0"
        >
          <Filter className="w-4 h-4 mr-2" />
          Advanced
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="shrink-0"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
      
      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        {relevantStatuses.map((status) => (
          <Badge
            key={status.value}
            variant={filters.status.includes(status.value) ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/80"
            onClick={() => handleStatusToggle(status.value)}
          >
            {status.label}
            {filters.status.includes(status.value) && (
              <X className="w-3 h-3 ml-1" />
            )}
          </Badge>
        ))}
      </div>
      
      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
          {/* Priority Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <div className="flex flex-wrap gap-1">
              {PRIORITY_OPTIONS.map((priority) => (
                <Badge
                  key={priority.value}
                  variant={filters.priority.includes(priority.value) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => handlePriorityToggle(priority.value)}
                >
                  {priority.label}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Assigned To Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Assigned To</label>
            <Select
              value={filters.assignedTo}
              onValueChange={(value) => onFiltersChange({ ...filters, assignedTo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All team members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All team members</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range Filters */}
          {(viewType === 'bookings' || viewType === 'all') && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom || "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                      onSelect={(date) => 
                        onFiltersChange({ 
                          ...filters, 
                          dateFrom: date ? date.toISOString().split('T')[0] : '' 
                        })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo || "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                      onSelect={(date) => 
                        onFiltersChange({ 
                          ...filters, 
                          dateTo: date ? date.toISOString().split('T')[0] : '' 
                        })
                      }
                      disabled={(date) => 
                        filters.dateFrom ? date < new Date(filters.dateFrom) : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {filters.status.length > 0 && (
            <Badge variant="secondary">{filters.status.length} status</Badge>
          )}
          {filters.priority.length > 0 && (
            <Badge variant="secondary">{filters.priority.length} priority</Badge>
          )}
          {filters.assignedTo && (
            <Badge variant="secondary">assigned</Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary">date range</Badge>
          )}
          {filters.q && (
            <Badge variant="secondary">search</Badge>
          )}
        </div>
      )}
    </div>
  )
}
```

### 3.3 Booking Calendar View Component

```typescript
// src/components/admin/service-requests/booking-calendar-view.tsx
'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Clock, User, MapPin } from 'lucide-react'
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

interface BookingCalendarViewProps {
  bookings: any[]
  onBookingSelect: (booking: any) => void
}

export function BookingCalendarView({ bookings, onBookingSelect }: BookingCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [view, setView] = useState<'calendar' | 'agenda'>('calendar')
  
  const selectedDateBookings = bookings.filter(booking => 
    booking.scheduledAt && isSameDay(new Date(booking.scheduledAt), selectedDate)
  )
  
  const weekStart = startOfWeek(selectedDate)
  const weekEnd = endOfWeek(selectedDate)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      booking.scheduledAt && isSameDay(new Date(booking.scheduledAt), date)
    )
  }
  
  const getStatusColor = (status: string) => {
    const colors = {
      'PENDING_CONFIRMATION': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'NO_SHOW': 'bg-orange-100 text-orange-800',
      'RESCHEDULED': 'bg-purple-100 text-purple-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar View */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Booking Calendar</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant={view === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('calendar')}
                >
                  Calendar
                </Button>
                <Button
                  variant={view === 'agenda' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('agenda')}
                >
                  Agenda
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {view === 'calendar' ? (
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    hasBookings: (date) => getBookingsForDate(date).length > 0
                  }}
                  modifiersStyles={{
                    hasBookings: { fontWeight: 'bold', backgroundColor: '#e0f2fe' }
                  }}
                />
                
                {/* Booking indicators */}
                <div className="mt-4 grid grid-cols-7 gap-1 text-xs">
                  {weekDays.map((day) => {
                    const dayBookings = getBookingsForDate(day)
                    return (
                      <div key={day.toISOString()} className="min-h-[60px] p-1">
                        <div className="font-medium text-center mb-1">
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayBookings.slice(0, 3).map((booking) => (
                            <div
                              key={booking.id}
                              className={`text-xs p-1 rounded cursor-pointer truncate ${getStatusColor(booking.status)}`}
                              onClick={() => onBookingSelect(booking)}
                            >
                              {format(new Date(booking.scheduledAt), 'HH:mm')}
                            </div>
                          ))}
                          {dayBookings.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{dayBookings.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Week view agenda */}
                {weekDays.map((day) => {
                  const dayBookings = getBookingsForDate(day)
                  return (
                    <div key={day.toISOString()} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">
                          {format(day, 'EEEE, MMMM d')}
                        </h4>
                        <Badge variant="outline">
                          {dayBookings.length} bookings
                        </Badge>
                      </div>
                      
                      {dayBookings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No bookings</p>
                      ) : (
                        <div className="space-y-2">
                          {dayBookings
                            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                            .map((booking) => (
                              <div
                                key={booking.id}
                                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                                onClick={() => onBookingSelect(booking)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="text-sm font-medium">
                                    {format(new Date(booking.scheduledAt), 'HH:mm')}
                                  </div>
                                  <div>
                                    <div className="font-medium">{booking.title}</div>
                                    <div className="text-sm text-muted-foreground flex items-center space-x-2">
                                      <User className="w-3 h-3" />
                                      <span>{booking.clientName}</span>
                                      {booking.assignedTeamMember && (
                                        <>
                                          <span>•</span>
                                          <span>{booking.assignedTeamMember.name}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Selected Date Details */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{format(selectedDate, 'MMMM d, yyyy')}</span>
              <Badge variant="outline">
                {selectedDateBookings.length} bookings
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {selectedDateBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No bookings scheduled for this date
              </p>
            ) : (
              <div className="space-y-4">
                {selectedDateBookings
                  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/30"
                      onClick={() => onBookingSelect(booking)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(booking.scheduledAt), 'HH:mm')}
                          </span>
                          <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      <h4 className="font-medium mb-1">{booking.title}</h4>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <User className="w-3 h-3" />
                        <span>{booking.clientName}</span>
                        {booking.clientPhone && (
                          <>
                            <span>•</span>
                            <span>{booking.clientPhone}</span>
                          </>
                        )}
                      </div>
                      
                      {booking.assignedTeamMember && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs">
                              {booking.assignedTeamMember.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">
                            Assigned to {booking.assignedTeamMember.name}
                          </span>
                        </div>
                      )}
                      
                      {booking.service && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {booking.service.name} • {booking.duration || booking.service.duration} minutes
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Overview</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {['CONFIRMED', 'PENDING_CONFIRMATION', 'IN_PROGRESS', 'COMPLETED'].map((status) => {
                const count = selectedDateBookings.filter(b => b.status === status).length
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">{status.replace('_', ' ')}</span>
                    <Badge variant="outline" className={count > 0 ? getStatusColor(status) : ''}>
                      {count}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## Phase 4: Hooks and State Management

### 4.1 Enhanced Service Requests Hook

```typescript
// src/hooks/useServiceRequests.ts (enhanced)
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

interface UseServiceRequestsOptions {
  type?: 'all' | 'requests' | 'bookings'
  status?: string[]
  priority?: string[]
  assignedTo?: string
  clientId?: string
  serviceId?: string
  dateFrom?: string
  dateTo?: string
  q?: string
  page?: number
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseServiceRequestsReturn {
  data: any[] | null
  loading: boolean
  error: Error | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  } | null
  refresh: () => Promise<void>
  create: (data: any) => Promise<any>
  update: (id: string, data: any) => Promise<any>
  delete: (id: string) => Promise<void>
}

export function useServiceRequests(options: UseServiceRequestsOptions = {}): UseServiceRequestsReturn {
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [pagination, setPagination] = useState(null)
  
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    
    if (options.type === 'bookings') {
      params.set('isBooking', 'true')
    } else if (options.type === 'requests') {
      params.set('isBooking', 'false')
    }
    
    if (options.status?.length) {
      params.set('status', options.status.join(','))
    }
    
    if (options.priority?.length) {
      params.set('priority', options.priority.join(','))
    }
    
    if (options.assignedTo) {
      params.set('assignedTo', options.assignedTo)
    }
    
    if (options.clientId) {
      params.set('clientId', options.clientId)
    }
    
    if (options.serviceId) {
      params.set('serviceId', options.serviceId)
    }
    
    if (options.dateFrom) {
      params.set('dateFrom', options.dateFrom)
    }
    
    if (options.dateTo) {
      params.set('dateTo', options.dateTo)
    }
    
    if (options.q) {
      params.set('q', options.q)
    }
    
    params.set('page', String(options.page || 1))
    params.set('limit', String(options.limit || 20))
    
    return params
  }, [options])
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = buildQueryParams()
      const response = await apiFetch(`/api/admin/service-requests?${queryParams}`)
      
      if (response.success) {
        setData(response.data)
        setPagination(response.pagination)
      } else {
        throw new Error(response.error?.message || 'Failed to fetch service requests')
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [buildQueryParams])
  
  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])
  
  const create = useCallback(async (createData: any) => {
    const response = await apiFetch('/api/admin/service-requests', {
      method: 'POST',
      body: JSON.stringify(createData)
    })
    
    if (response.success) {
      await refresh()
      return response.data
    } else {
      throw new Error(response.error?.message || 'Failed to create service request')
    }
  }, [refresh])
  
  const update = useCallback(async (id: string, updateData: any) => {
    const response = await apiFetch(`/api/admin/service-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    })
    
    if (response.success) {
      await refresh()
      return response.data
    } else {
      throw new Error(response.error?.message || 'Failed to update service request')
    }
  }, [refresh])
  
  const deleteItem = useCallback(async (id: string) => {
    const response = await apiFetch(`/api/admin/service-requests/${id}`, {
      method: 'DELETE'
    })
    
    if (response.success) {
      await refresh()
    } else {
      throw new Error(response.error?.message || 'Failed to delete service request')
    }
  }, [refresh])
  
  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // Auto refresh
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(refresh, options.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [options.autoRefresh, options.refreshInterval, refresh])
  
  return {
    data,
    loading,
    error,
    pagination,
    refresh,
    create,
    update,
    delete: deleteItem
  }
}
```

### 4.2 Booking-Specific Hooks

```typescript
// src/hooks/useAvailability.ts
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

interface UseAvailabilityOptions {
  serviceId: string
  date?: string
  days?: number
  teamMemberId?: string
  enabled?: boolean
}

interface AvailabilitySlot {
  date: string
  slots: {
    start: string
    end: string
    available: boolean
    reason?: string
  }[]
}

export function useAvailability(options: UseAvailabilityOptions) {
  const [data, setData] = useState<AvailabilitySlot[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchAvailability = useCallback(async () => {
    if (!options.enabled || !options.serviceId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        serviceId: options.serviceId,
        ...(options.date && { date: options.date }),
        ...(options.days && { days: String(options.days) }),
        ...(options.teamMemberId && { teamMemberId: options.teamMemberId })
      })
      
      const response = await apiFetch(`/api/admin/service-requests/availability?${params}`)
      
      if (response.success) {
        setData(response.availability)
      } else {
        throw new Error(response.error?.message || 'Failed to fetch availability')
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [options])
  
  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])
  
  return {
    data,
    loading,
    error,
    refresh: fetchAvailability
  }
}

// src/hooks/useBookingActions.ts
import { useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'

interface UseBookingActionsOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useBookingActions(options: UseBookingActionsOptions = {}) {
  const confirm = useCallback(async (bookingId: string) => {
    try {
      const response = await apiFetch(`/api/admin/service-requests/${bookingId}/confirm`, {
        method: 'POST'
      })
      
      if (response.success) {
        toast({
          title: 'Booking Confirmed',
          description: 'Confirmation email sent to client'
        })
        options.onSuccess?.()
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to confirm booking')
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      })
      options.onError?.(err)
      throw err
    }
  }, [options])
  
  const reschedule = useCallback(async (bookingId: string, newDateTime: string, reason?: string) => {
    try {
      const response = await apiFetch(`/api/admin/service-requests/${bookingId}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({
          scheduledAt: newDateTime,
          reason
        })
      })
      
      if (response.success) {
        toast({
          title: 'Booking Rescheduled',
          description: 'Client has been notified of the change'
        })
        options.onSuccess?.()
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to reschedule booking')
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      })
      options.onError?.(err)
      throw err
    }
  }, [options])
  
  const cancel = useCallback(async (bookingId: string, reason?: string) => {
    try {
      const response = await apiFetch(`/api/admin/service-requests/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'CANCELLED',
          cancelReason: reason
        })
      })
      
      if (response.success) {
        toast({
          title: 'Booking Cancelled',
          description: 'Client has been notified of the cancellation'
        })
        options.onSuccess?.()
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to cancel booking')
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      })
      options.onError?.(err)
      throw err
    }
  }, [options])
  
  const markNoShow = useCallback(async (bookingId: string) => {
    try {
      const response = await apiFetch(`/api/admin/service-requests/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'NO_SHOW'
        })
      })
      
      if (response.success) {
        toast({
          title: 'Marked as No Show',
          description: 'Booking status updated'
        })
        options.onSuccess?.()
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to mark as no show')
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      })
      options.onError?.(err)
      throw err
    }
  }, [options])
  
  return {
    confirm,
    reschedule,
    cancel,
    markNoShow
  }
}
```

---

## Phase 5: Business Logic Integration

### 5.1 Enhanced Validation Schemas

```typescript
// src/lib/schemas/service-requests.ts (enhanced)
import { z } from 'zod'

// Base service request schema
export const BaseServiceRequestSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  serviceId: z.string().min(1, 'Service is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(300, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).default('MEDIUM'),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  requirements: z.record(z.string(), z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  tenantId: z.string().optional()
})

// Booking-specific schema
export const BookingServiceRequestSchema = z.object({
  isBooking: z.literal(true),
  clientId: z.string().optional(), // Optional for guest bookings
  serviceId: z.string().min(1, 'Service is required'),
  title: z.
  export const BookingServiceRequestSchema = z.object({
  isBooking: z.literal(true),
  clientId: z.string().optional(), // Optional for guest bookings
  serviceId: z.string().min(1, 'Service is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(300, 'Title too long'),
  scheduledAt: z.string().datetime('Invalid date format'),
  duration: z.number().min(15, 'Minimum 15 minutes').max(480, 'Maximum 8 hours').optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().optional(),
  bookingType: z.enum(['STANDARD', 'RECURRING', 'EMERGENCY', 'CONSULTATION']).default('STANDARD'),
  recurringPattern: z.object({
    frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    endDate: z.string().datetime().optional(),
    occurrences: z.number().min(1).max(52).optional()
  }).optional(),
  requirements: z.record(z.string(), z.any()).optional(),
  tenantId: z.string().optional()
})

// Unified create schema using discriminated union
export const CreateServiceRequestSchema = z.discriminatedUnion('isBooking', [
  BaseServiceRequestSchema.extend({ isBooking: z.literal(false).optional() }),
  BookingServiceRequestSchema
])

// Reschedule schema
export const RescheduleBookingSchema = z.object({
  scheduledAt: z.string().datetime('Invalid date format'),
  reason: z.string().max(500, 'Reason too long').optional()
})

// Booking confirmation schema
export const BookingConfirmationSchema = z.object({
  confirmed: z.boolean().default(true),
  notes: z.string().max(1000, 'Notes too long').optional()
})

// Availability query schema
export const AvailabilityQuerySchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  days: z.number().min(1).max(30).default(7),
  teamMemberId: z.string().optional()
})

// Update service request schema
export const UpdateServiceRequestSchema = z.object({
  title: z.string().min(5).max(300).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional(),
  status: z.enum([
    'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'ASSIGNED', 
    'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PENDING_CONFIRMATION', 
    'CONFIRMED', 'RESCHEDULED', 'NO_SHOW', 'PARTIALLY_COMPLETED'
  ]).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  requirements: z.record(z.string(), z.any()).optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(15).max(480).optional(),
  clientPhone: z.string().optional(),
  cancelReason: z.string().max(500).optional()
})
```

### 5.2 Enhanced Business Logic

```typescript
// src/lib/service-requests/validation.ts (enhanced)
import { prisma } from '@/lib/prisma'
import { isMultiTenancyEnabled } from '@/lib/tenant'

export async function validateBookingFields(data: any, tenantId?: string): Promise<void> {
  // Validate service exists and supports bookings
  const service = await prisma.service.findFirst({
    where: {
      id: data.serviceId,
      active: true,
      bookingEnabled: true,
      ...(tenantId && isMultiTenancyEnabled() ? { tenantId } : {})
    }
  })
  
  if (!service) {
    throw new Error('Service not found or not available for booking')
  }
  
  // Validate scheduling constraints
  const scheduledAt = new Date(data.scheduledAt)
  const now = new Date()
  
  // Check minimum advance notice
  const hoursFromNow = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (hoursFromNow < service.minAdvanceHours) {
    throw new Error(`Bookings must be scheduled at least ${service.minAdvanceHours} hours in advance`)
  }
  
  // Check maximum advance booking
  const daysFromNow = hoursFromNow / 24
  if (daysFromNow > service.advanceBookingDays) {
    throw new Error(`Bookings cannot be scheduled more than ${service.advanceBookingDays} days in advance`)
  }
  
  // Validate business hours
  await validateBusinessHours(service.id, scheduledAt)
  
  // Check blackout dates
  if (service.blackoutDates?.some(date => 
    new Date(date).toDateString() === scheduledAt.toDateString()
  )) {
    throw new Error('Selected date is not available')
  }
}

export async function validateBusinessHours(serviceId: string, scheduledAt: Date): Promise<void> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  })
  
  if (!service) {
    throw new Error('Service not found')
  }
  
  const dayOfWeek = scheduledAt.getDay() // 0 = Sunday, 1 = Monday, etc.
  const timeString = scheduledAt.toTimeString().substr(0, 5) // "HH:MM"
  
  // Default business hours (can be overridden by service.businessHours JSON)
  const defaultBusinessHours = {
    0: null, // Sunday - closed
    1: { start: '09:00', end: '17:00' }, // Monday
    2: { start: '09:00', end: '17:00' }, // Tuesday
    3: { start: '09:00', end: '17:00' }, // Wednesday
    4: { start: '09:00', end: '17:00' }, // Thursday
    5: { start: '09:00', end: '17:00' }, // Friday
    6: null  // Saturday - closed
  }
  
  const businessHours = service.businessHours as any || defaultBusinessHours
  const dayHours = businessHours[dayOfWeek]
  
  if (!dayHours) {
    throw new Error('Service is not available on this day of the week')
  }
  
  if (timeString < dayHours.start || timeString >= dayHours.end) {
    throw new Error(`Service is only available between ${dayHours.start} and ${dayHours.end}`)
  }
}

export async function checkAvailabilityConflicts(
  serviceId: string,
  scheduledAt: Date,
  duration: number,
  tenantId?: string,
  excludeBookingId?: string
): Promise<any[]> {
  const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000)
  
  // Check existing bookings
  const conflicts = await prisma.serviceRequest.findMany({
    where: {
      serviceId,
      isBooking: true,
      status: { in: ['CONFIRMED', 'PENDING_CONFIRMATION', 'IN_PROGRESS'] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      ...(tenantId && isMultiTenancyEnabled() ? { tenantId } : {}),
      AND: [
        { scheduledAt: { lt: endTime } },
        // Calculate end time for existing bookings
        {
          OR: [
            // Simple overlap check - this would need to be enhanced based on actual duration storage
            { scheduledAt: { gte: scheduledAt } }
          ]
        }
      ]
    },
    include: {
      client: { select: { name: true } },
      service: { select: { name: true } }
    }
  })
  
  return conflicts
}

export async function canUserRescheduleBooking(
  booking: any,
  user: any,
  newScheduledAt: Date
): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date()
  const currentScheduledAt = new Date(booking.scheduledAt)
  
  // Check if booking is in the past
  if (currentScheduledAt < now) {
    return { allowed: false, reason: 'Cannot reschedule past bookings' }
  }
  
  // Check if booking is too soon (less than 2 hours from now)
  const hoursFromNow = (currentScheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (hoursFromNow < 2) {
    return { allowed: false, reason: 'Cannot reschedule bookings less than 2 hours in advance' }
  }
  
  // Check if user has permission
  const isOwner = booking.clientId === user.id
  const isAdmin = ['ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER'].includes(user.role)
  
  if (!isOwner && !isAdmin) {
    return { allowed: false, reason: 'Not authorized to reschedule this booking' }
  }
  
  // Check if new time is valid
  const newHoursFromNow = (newScheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (newHoursFromNow < 24) {
    return { allowed: false, reason: 'New booking time must be at least 24 hours from now' }
  }
  
  return { allowed: true }
}
```

### 5.3 Availability Engine

```typescript
// src/lib/service-requests/availability.ts (new)
import { prisma } from '@/lib/prisma'
import { isMultiTenancyEnabled } from '@/lib/tenant'
import { addDays, format, eachDayOfInterval, setHours, setMinutes, addMinutes } from 'date-fns'

interface AvailabilityOptions {
  serviceId: string
  startDate: Date
  endDate: Date
  teamMemberId?: string
  tenantId?: string
  slotDuration?: number // minutes
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
  reason?: string
  teamMemberId?: string
}

interface DayAvailability {
  date: string
  slots: TimeSlot[]
}

export async function getAvailabilitySlots(options: AvailabilityOptions): Promise<DayAvailability[]> {
  const {
    serviceId,
    startDate,
    endDate,
    teamMemberId,
    tenantId,
    slotDuration = 30
  } = options
  
  // Get service details
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      active: true,
      bookingEnabled: true,
      ...(tenantId && isMultiTenancyEnabled() ? { tenantId } : {})
    }
  })
  
  if (!service) {
    throw new Error('Service not found')
  }
  
  // Get existing bookings in the date range
  const existingBookings = await prisma.serviceRequest.findMany({
    where: {
      serviceId,
      isBooking: true,
      status: { in: ['CONFIRMED', 'PENDING_CONFIRMATION', 'IN_PROGRESS'] },
      scheduledAt: {
        gte: startDate,
        lte: endDate
      },
      ...(teamMemberId ? { assignedTeamMemberId: teamMemberId } : {}),
      ...(tenantId && isMultiTenancyEnabled() ? { tenantId } : {})
    },
    include: {
      assignedTeamMember: true
    }
  })
  
  // Get predefined availability slots
  const predefinedSlots = await prisma.availabilitySlot.findMany({
    where: {
      serviceId,
      date: {
        gte: startDate,
        lte: endDate
      },
      ...(teamMemberId ? { teamMemberId } : {})
    }
  })
  
  // Generate availability for each day
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const availability: DayAvailability[] = []
  
  for (const day of days) {
    const dayAvailability = await generateDayAvailability({
      date: day,
      service,
      existingBookings,
      predefinedSlots,
      teamMemberId,
      slotDuration
    })
    
    availability.push(dayAvailability)
  }
  
  return availability
}

async function generateDayAvailability({
  date,
  service,
  existingBookings,
  predefinedSlots,
  teamMemberId,
  slotDuration
}: {
  date: Date
  service: any
  existingBookings: any[]
  predefinedSlots: any[]
  teamMemberId?: string
  slotDuration: number
}): Promise<DayAvailability> {
  const dayOfWeek = date.getDay()
  const dateString = format(date, 'yyyy-MM-dd')
  
  // Get business hours for this day
  const defaultBusinessHours = {
    0: null, // Sunday
    1: { start: '09:00', end: '17:00' },
    2: { start: '09:00', end: '17:00' },
    3: { start: '09:00', end: '17:00' },
    4: { start: '09:00', end: '17:00' },
    5: { start: '09:00', end: '17:00' },
    6: null // Saturday
  }
  
  const businessHours = (service.businessHours as any) || defaultBusinessHours
  const dayHours = businessHours[dayOfWeek]
  
  if (!dayHours) {
    return {
      date: dateString,
      slots: []
    }
  }
  
  // Check if day is in blackout dates
  const isBlackoutDate = service.blackoutDates?.some((blackoutDate: any) =>
    format(new Date(blackoutDate), 'yyyy-MM-dd') === dateString
  )
  
  if (isBlackoutDate) {
    return {
      date: dateString,
      slots: [{
        start: dayHours.start,
        end: dayHours.end,
        available: false,
        reason: 'Blackout date'
      }]
    }
  }
  
  // Generate time slots for the day
  const slots: TimeSlot[] = []
  const [startHour, startMinute] = dayHours.start.split(':').map(Number)
  const [endHour, endMinute] = dayHours.end.split(':').map(Number)
  
  let currentTime = setMinutes(setHours(date, startHour), startMinute)
  const endTime = setMinutes(setHours(date, endHour), endMinute)
  
  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, slotDuration)
    
    if (slotEnd > endTime) break
    
    const startTimeString = format(currentTime, 'HH:mm')
    const endTimeString = format(slotEnd, 'HH:mm')
    
    // Check if this slot conflicts with existing bookings
    const conflict = existingBookings.find(booking => {
      const bookingStart = new Date(booking.scheduledAt)
      const bookingEnd = addMinutes(bookingStart, booking.duration || service.duration)
      
      return (
        (currentTime >= bookingStart && currentTime < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (currentTime < bookingStart && slotEnd > bookingEnd)
      )
    })
    
    // Check predefined availability slots
    const predefinedSlot = predefinedSlots.find(slot =>
      format(new Date(slot.date), 'yyyy-MM-dd') === dateString &&
      slot.startTime === startTimeString
    )
    
    let available = true
    let reason: string | undefined
    
    if (conflict) {
      available = false
      reason = 'Booked'
    } else if (predefinedSlot && !predefinedSlot.available) {
      available = false
      reason = predefinedSlot.reason || 'Unavailable'
    } else if (predefinedSlot && predefinedSlot.currentBookings >= predefinedSlot.maxBookings) {
      available = false
      reason = 'Fully booked'
    }
    
    slots.push({
      start: startTimeString,
      end: endTimeString,
      available,
      reason,
      teamMemberId: conflict?.assignedTeamMemberId || predefinedSlot?.teamMemberId
    })
    
    currentTime = slotEnd
  }
  
  return {
    date: dateString,
    slots
  }
}

export async function createRecurringBookings(
  parentBookingId: string,
  pattern: {
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
    endDate?: string
    occurrences?: number
  }
): Promise<void> {
  const parentBooking = await prisma.serviceRequest.findUnique({
    where: { id: parentBookingId },
    include: { service: true }
  })
  
  if (!parentBooking || !parentBooking.scheduledAt) {
    throw new Error('Parent booking not found or missing schedule')
  }
  
  const startDate = new Date(parentBooking.scheduledAt)
  const endDate = pattern.endDate ? new Date(pattern.endDate) : undefined
  const maxOccurrences = pattern.occurrences || 52 // Default max 1 year
  
  let currentDate = new Date(startDate)
  const bookingsToCreate = []
  let occurrenceCount = 0
  
  // Generate recurring dates
  while (occurrenceCount < maxOccurrences) {
    // Move to next occurrence
    switch (pattern.frequency) {
      case 'WEEKLY':
        currentDate = addDays(currentDate, 7)
        break
      case 'BIWEEKLY':
        currentDate = addDays(currentDate, 14)
        break
      case 'MONTHLY':
        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1))
        break
    }
    
    // Check if we've reached the end date
    if (endDate && currentDate > endDate) {
      break
    }
    
    // Check for conflicts
    const conflicts = await checkAvailabilityConflicts(
      parentBooking.serviceId,
      currentDate,
      parentBooking.duration || parentBooking.service.duration,
      parentBooking.tenantId
    )
    
    if (conflicts.length === 0) {
      bookingsToCreate.push({
        ...parentBooking,
        id: undefined, // Let Prisma generate new ID
        scheduledAt: currentDate,
        parentBookingId,
        status: 'PENDING_CONFIRMATION',
        confirmed: false,
        reminderSent: false
      })
    }
    
    occurrenceCount++
  }
  
  // Create the recurring bookings
  if (bookingsToCreate.length > 0) {
    await prisma.serviceRequest.createMany({
      data: bookingsToCreate.map(booking => {
        const { id, client, service, assignedTeamMember, ...data } = booking
        return data
      })
    })
  }
}
```

---

## Phase 6: Email and Notifications

### 6.1 Enhanced Email System

```typescript
// src/lib/email.ts (enhanced)
import { ServiceRequest, User, Service, TeamMember } from '@prisma/client'
import { sendEmail } from './email-provider'
import { generateICSFile } from './calendar'

type BookingWithRelations = ServiceRequest & {
  client: User
  service: Service
  assignedTeamMember?: TeamMember | null
}

export async function sendBookingConfirmation(booking: BookingWithRelations): Promise<void> {
  if (!booking.isBooking || !booking.scheduledAt) {
    throw new Error('Invalid booking data for confirmation email')
  }
  
  const icsContent = generateICSFile(booking)
  
  const emailData = {
    clientName: booking.clientName || booking.client.name,
    serviceName: booking.service.name,
    serviceDescription: booking.service.description,
    scheduledAt: new Date(booking.scheduledAt).toLocaleString(),
    duration: booking.duration || booking.service.duration,
    bookingId: booking.uuid,
    assignedTeamMember: booking.assignedTeamMember?.name,
    requirements: booking.requirements,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@company.com',
    supportPhone: process.env.SUPPORT_PHONE || '+1 (555) 123-4567',
    cancelLink: `${process.env.NEXTAUTH_URL}/portal/service-requests/${booking.id}`,
    rescheduleLink: `${process.env.NEXTAUTH_URL}/portal/service-requests/${booking.id}/reschedule`
  }
  
  await sendEmail({
    to: booking.clientEmail || booking.client.email,
    subject: `Booking Confirmed: ${booking.service.name}`,
    template: 'booking-confirmation',
    data: emailData,
    attachments: [{
      filename: `booking-${booking.uuid}.ics`,
      content: icsContent,
      contentType: 'text/calendar; method=REQUEST'
    }]
  })
  
  // Send copy to assigned team member if exists
  if (booking.assignedTeamMember?.email) {
    await sendEmail({
      to: booking.assignedTeamMember.email,
      subject: `New Booking Assignment: ${booking.service.name}`,
      template: 'booking-assignment',
      data: {
        ...emailData,
        teamMemberName: booking.assignedTeamMember.name
      }
    })
  }
}

export async function sendBookingReminder(booking: BookingWithRelations, hoursAdvance: number = 24): Promise<void> {
  if (!booking.isBooking || !booking.scheduledAt) {
    return
  }
  
  const emailData = {
    clientName: booking.clientName || booking.client.name,
    serviceName: booking.service.name,
    scheduledAt: new Date(booking.scheduledAt).toLocaleString(),
    duration: booking.duration || booking.service.duration,
    bookingId: booking.uuid,
    assignedTeamMember: booking.assignedTeamMember?.name,
    hoursAdvance,
    cancelLink: `${process.env.NEXTAUTH_URL}/portal/service-requests/${booking.id}`,
    rescheduleLink: `${process.env.NEXTAUTH_URL}/portal/service-requests/${booking.id}/reschedule`,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@company.com',
    supportPhone: process.env.SUPPORT_PHONE || '+1 (555) 123-4567'
  }
  
  await sendEmail({
    to: booking.clientEmail || booking.client.email,
    subject: `Reminder: Your ${booking.service.name} appointment tomorrow`,
    template: 'booking-reminder',
    data: emailData
  })
}

export async function sendBookingRescheduleNotification(
  booking: BookingWithRelations,
  reason?: string
): Promise<void> {
  if (!booking.isBooking || !booking.scheduledAt) {
    return
  }
  
  const emailData = {
    clientName: booking.clientName || booking.client.name,
    serviceName: booking.service.name,
    newScheduledAt: new Date(booking.scheduledAt).toLocaleString(),
    duration: booking.duration || booking.service.duration,
    bookingId: booking.uuid,
    reason,
    assignedTeamMember: booking.assignedTeamMember?.name,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@company.com',
    supportPhone: process.env.SUPPORT_PHONE || '+1 (555) 123-4567'
  }
  
  // Generate new ICS with updated time
  const icsContent = generateICSFile(booking)
  
  await sendEmail({
    to: booking.clientEmail || booking.client.email,
    subject: `Booking Rescheduled: ${booking.service.name}`,
    template: 'booking-rescheduled',
    data: emailData,
    attachments: [{
      filename: `booking-${booking.uuid}-updated.ics`,
      content: icsContent,
      contentType: 'text/calendar; method=REQUEST'
    }]
  })
}

export async function sendBookingCancellationNotification(
  booking: BookingWithRelations,
  reason?: string,
  cancelledBy: 'client' | 'staff' = 'staff'
): Promise<void> {
  if (!booking.isBooking) {
    return
  }
  
  const emailData = {
    clientName: booking.clientName || booking.client.name,
    serviceName: booking.service.name,
    originalScheduledAt: booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : 'N/A',
    bookingId: booking.uuid,
    reason,
    cancelledBy,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@company.com',
    supportPhone: process.env.SUPPORT_PHONE || '+1 (555) 123-4567',
    rebookLink: `${process.env.NEXTAUTH_URL}/booking?service=${booking.serviceId}`
  }
  
  await sendEmail({
    to: booking.clientEmail || booking.client.email,
    subject: `Booking Cancelled: ${booking.service.name}`,
    template: 'booking-cancelled',
    data: emailData
  })
}

// Enhanced service request notification to handle bookings
export async function sendServiceRequestNotification(
  request: ServiceRequest & { client: User; service: Service; assignedTeamMember?: TeamMember | null },
  type: 'created' | 'assigned' | 'status_changed' | 'confirmed' | 'reminder' | 'rescheduled' | 'cancelled'
) {
  if (request.isBooking) {
    switch (type) {
      case 'confirmed':
        return await sendBookingConfirmation(request as BookingWithRelations)
      case 'reminder':
        return await sendBookingReminder(request as BookingWithRelations)
      case 'rescheduled':
        return await sendBookingRescheduleNotification(request as BookingWithRelations)
      case 'cancelled':
        return await sendBookingCancellationNotification(request as BookingWithRelations)
    }
  }
  
  // Handle regular service request notifications
  return await sendExistingServiceRequestNotification(request, type)
}

// Calendar ICS file generation
export function generateICSFile(booking: BookingWithRelations): string {
  if (!booking.scheduledAt) {
    throw new Error('Booking must have a scheduled date')
  }
  
  const startDate = new Date(booking.scheduledAt)
  const endDate = new Date(startDate.getTime() + (booking.duration || booking.service.duration) * 60 * 1000)
  
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Your Company//Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:booking-${booking.uuid}@yourcompany.com`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${booking.service.name}`,
    `DESCRIPTION:${booking.service.description || ''}${booking.requirements ? '\n\nRequirements: ' + JSON.stringify(booking.requirements) : ''}`,
    `ORGANIZER;CN="Your Company":mailto:${process.env.SUPPORT_EMAIL || 'support@company.com'}`,
    `ATTENDEE;CN="${booking.clientName || booking.client.name}";RSVP=TRUE:mailto:${booking.clientEmail || booking.client.email}`,
    ...(booking.assignedTeamMember?.email ? [`ATTENDEE;CN="${booking.assignedTeamMember.name}":mailto:${booking.assignedTeamMember.email}`] : []),
    `STATUS:${booking.status === 'CONFIRMED' ? 'CONFIRMED' : 'TENTATIVE'}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${booking.service.name} in 1 hour`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  
  return icsContent
}
```

### 6.2 Enhanced Cron System

```typescript
// src/lib/cron.ts (enhanced)
import { prisma } from './prisma'
import { sendBookingReminder, sendServiceRequestNotification } from './email'
import { addDays, subHours, isPast } from 'date-fns'

export async function sendBookingReminders(): Promise<void> {
  console.log('Starting booking reminder job...')
  
  try {
    // Get booking preferences to determine reminder timing
    const reminderHours = [24, 2] // Default: 24 hours and 2 hours before
    
    for (const hours of reminderHours) {
      const targetTime = addDays(new Date(), hours === 24 ? 1 : 0)
      if (hours === 2) {
        targetTime.setTime(targetTime.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now
      }
      
      const startRange = subHours(targetTime, 1)
      const endRange = addDays(targetTime, hours === 24 ? 0 : 0)
      
      const bookings = await prisma.serviceRequest.findMany({
        where: {
          isBooking: true,
          status: 'CONFIRMED',
          reminderSent: false,
          scheduledAt: {
            gte: startRange,
            lte: endRange
          }
        },
        include: {
          client: true,
          service: true,
          assignedTeamMember: true
        }
      })
      
      console.log(`Found ${bookings.length} bookings# Booking/Service Request Integration Plan

## Executive Summary

This document outlines the comprehensive integration of the Booking module into the existing Service Request system to create a unified workflow. The integration preserves all existing Service Request functionality while adopting Booking's appointment scheduling, availability management, and confirmation workflows.

**Key Integration Approach**: Extend Service Request to include booking-specific fields and workflows rather than merging two separate systems, maintaining the robust RBAC, tenancy, realtime, and audit capabilities already established in Service Requests.

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Phase 1: Data Model Unification](#phase-1-data-model-unification)
3. [Phase 2: API Integration](#phase-2-api-integration)
4. [Phase 3: UI Component Integration](#phase-3-ui-component-integration)
5. [Phase 4: Hooks and State Management](#phase-4-hooks-and-state-management)
6. [Phase 5: Business Logic Integration](#phase-5-business-logic-integration)
7. [Phase 6: Email and Notifications](#phase-6-email-and-notifications)
8. [Phase 7: Testing Integration](#phase-7-testing-integration)
9. [Phase 8: Migration and Deployment](#phase-8-migration-and-deployment)
10. [Phase 9: File Changes Summary](#phase-9-file-changes-summary)
11. [Phase 10: Implementation Timeline](#phase-10-implementation-timeline)
12. [Phase 11: Risk Mitigation](#phase-11-risk-mitigation)
13. [Phase 12: Success Metrics](#phase-12-success-metrics)
14. [Phase 13: Post-Integration Maintenance](#phase-13-post-integration-maintenance)
15. [Phase 14: ServiceMarket-Style Home Page Booking](#phase-14-servicemarket-style-home-page-booking-integration)
16. [Phase 15: Security and Performance Optimization](#phase-15-security-and-performance-optimization)
17. [Phase 16: Accessibility and Internationalization](#phase-16-accessibility-and-internationalization)
18. [Phase 17: Analytics and Business Intelligence](#phase-17-analytics-and-business-intelligence)
19. [Phase 18: Integration Testing and Quality Assurance](#phase-18-integration-testing-and-quality-assurance)

---

## Current State Analysis

### Service Request Module (Target - Mature)
- **Status**: Active, well-architected with comprehensive RBAC, tenancy, realtime, audit logging
- **Strengths**: Standardized API responses, Zod validation, permission gates, realtime updates, multi-tenancy support
- **Coverage**: Admin/Portal UIs, CSV export, analytics, bulk operations, auto-assignment, attachments with AV scanning

### Booking Module (Source - Basic)
- **Status**: Functional but basic architecture
- **Strengths**: Public booking wizard, availability engine, email confirmations, ICS attachments
- **Weaknesses**: No Zod validation, inconsistent API responses, limited RBAC, no multi-tenancy

### Integration Strategy
**Absorption Pattern**: Extend Service Request with booking capabilities rather than maintaining parallel systems. This leverages the mature Service Request architecture while adding scheduling-specific features.

---

## Phase 1: Data Model Unification

### 1.1 Prisma Schema Changes

Extend the existing ServiceRequest model to support booking workflows:

```prisma
model ServiceRequest {
  // Existing fields preserved
  id                    String            @id @default(cuid())
  uuid                  String            @unique @default(uuid())
  clientId              String
  serviceId             String
  title                 String
  description           String?           @db.Text
  priority              RequestPriority   @default(MEDIUM)
  status                RequestStatus     @default(DRAFT)
  budgetMin             Decimal?
  budgetMax             Decimal?
  deadline              DateTime?
  requirements          Json?
  attachments           Json?
  
  // Booking-specific fields (NEW)
  isBooking             Boolean           @default(false)
  scheduledAt           DateTime?
  duration              Int?              // minutes
  clientName            String?           // for guest bookings
  clientEmail           String?           // for guest bookings  
  clientPhone           String?
  confirmed             Boolean           @default(false)
  reminderSent          Boolean           @default(false)
  bookingType           BookingType?      @default(STANDARD)
  recurringPattern      Json?             // for recurring bookings
  parentBookingId       String?           // for recurring bookings
  
  // Existing relations preserved
  client                User              @relation("ServiceRequestClient", fields: [clientId], references: [id])
  service               Service           @relation(fields: [serviceId], references: [id])
  assignedTeamMember    TeamMember?       @relation(fields: [assignedTeamMemberId], references: [id])
  parentBooking         ServiceRequest?   @relation("RecurringBookings", fields: [parentBookingId], references: [id])
  childBookings         ServiceRequest[]  @relation("RecurringBookings")
  
  // Existing audit fields preserved
  assignedTeamMemberId  String?
  assignedAt            DateTime?
  assignedBy            String?
  completedAt           DateTime?
  clientApprovalAt      DateTime?
  tenantId              String?
  
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  
  // Existing relations preserved
  requestTasks          RequestTask[]
  comments              ServiceRequestComment[]
  attachmentsRel        Attachment[]
  
  // Add indexes for booking queries
  @@index([scheduledAt])
  @@index([isBooking, status])
  @@index([tenantId, scheduledAt])
  @@index([tenantId, isBooking, status])
  @@index([clientId, isBooking])
  @@index([assignedTeamMemberId, scheduledAt])
}

// Extend RequestStatus enum for booking-specific statuses
enum RequestStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  // Booking-specific statuses
  PENDING_CONFIRMATION  // booking submitted, awaiting confirmation
  CONFIRMED            // booking confirmed, scheduled
  RESCHEDULED          // booking moved to different time
  NO_SHOW             // client didn't show up for appointment
  PARTIALLY_COMPLETED // service partially completed
}

// Add booking type enum
enum BookingType {
  STANDARD      // One-time booking
  RECURRING     // Recurring booking (weekly, monthly, etc.)
  EMERGENCY     // Urgent/emergency booking
  CONSULTATION  // Consultation/assessment booking
}

// Enhanced Service model for booking support
model Service {
  // Existing fields
  id                    String    @id @default(cuid())
  name                  String
  description           String?   @db.Text
  price                 Decimal
  duration              Int       // minutes
  active                Boolean   @default(true)
  
  // Booking-specific enhancements
  bookingEnabled        Boolean   @default(true)
  advanceBookingDays    Int       @default(30)      // how far in advance can be booked
  minAdvanceHours       Int       @default(24)      // minimum advance notice required
  maxDailyBookings      Int?                        // limit bookings per day
  bufferTime            Int       @default(0)       // minutes between bookings
  businessHours         Json?                       // custom business hours
  blackoutDates         DateTime[]                  // unavailable dates
  
  // Existing relations
  serviceRequests       ServiceRequest[]
  availabilitySlots     AvailabilitySlot[]
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([active, bookingEnabled])
}

// New model for availability management
model AvailabilitySlot {
  id              String    @id @default(cuid())
  serviceId       String
  teamMemberId    String?
  date            DateTime
  startTime       String    // "09:00"
  endTime         String    // "10:00"  
  available       Boolean   @default(true)
  reason          String?   // "Holiday", "Booking", "Break", "Training"
  maxBookings     Int       @default(1)  // how many bookings this slot can handle
  currentBookings Int       @default(0)  // current booking count
  
  service         Service     @relation(fields: [serviceId], references: [id])
  teamMember      TeamMember? @relation(fields: [teamMemberId], references: [id])
  
  @@unique([serviceId, teamMemberId, date, startTime])
  @@index([date, serviceId])
  @@index([teamMemberId, date])
  @@index([available, date])
}

// Enhanced TeamMember model for booking assignments
model TeamMember {
  // Existing fields preserved
  id                    String             @id @default(cuid())
  name                  String
  email                 String?
  userId                String?
  role                  String?
  specialties           String[]
  isAvailable           Boolean            @default(true)
  status                String             @default("ACTIVE")
  
  // Booking-specific fields
  workingHours          Json?              // custom working hours
  timeZone              String?            @default("UTC")
  maxConcurrentBookings Int               @default(3)
  bookingBuffer         Int               @default(15)  // minutes between bookings
  autoAssign            Boolean           @default(true)
  
  // Relations
  serviceRequests       ServiceRequest[]
  availabilitySlots     AvailabilitySlot[]
  
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  
  @@index([isAvailable, status])
  @@index([userId])
}

// Notification preferences for bookings
model BookingPreferences {
  id                    String    @id @default(cuid())
  userId                String    @unique
  
  // Email notifications
  emailConfirmation     Boolean   @default(true)
  emailReminder         Boolean   @default(true)
  emailReschedule       Boolean   @default(true)
  emailCancellation     Boolean   @default(true)
  
  // SMS notifications
  smsReminder           Boolean   @default(false)
  smsConfirmation       Boolean   @default(false)
  
  // Reminder timing
  reminderHours         Int[]     @default([24, 2])  // hours before appointment
  
  // Other preferences
  timeZone              String    @default("UTC")
  preferredLanguage     String    @default("en")
  
  user                  User      @relation(fields: [userId], references: [id])
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

// Add booking preferences relation to User model
model User {
  // Existing fields...
  bookingPreferences    BookingPreferences?
  // Existing relations...
}
```
 console.log(`Found ${bookings.length} bookings needing ${hours}-hour reminders`)
      
      for (const booking of bookings) {
        try {
          await sendBookingReminder(booking as any, hours)
          
          // Mark reminder as sent only for 24-hour reminders
          // 2-hour reminders don't update the flag to allow multiple reminders
          if (hours === 24) {
            await prisma.serviceRequest.update({
              where: { id: booking.id },
              data: { reminderSent: true }
            })
          }
          
          console.log(`Sent ${hours}-hour reminder for booking ${booking.uuid}`)
        } catch (error) {
          console.error(`Failed to send reminder for booking ${booking.uuid}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('Booking reminder job failed:', error)
    throw error
  }
}

export async function updateBookingStatuses(): Promise<void> {
  console.log('Starting booking status update job...')
  
  try {
    const now = new Date()
    
    // Mark past confirmed bookings as completed
    const completedBookings = await prisma.serviceRequest.updateMany({
      where: {
        isBooking: true,
        status: 'CONFIRMED',
        scheduledAt: {
          lt: subHours(now, 2) // 2 hours past scheduled time
        }
      },
      data: {
        status: 'COMPLETED',
        completedAt: now
      }
    })
    
    console.log(`Marked ${completedBookings.count} bookings as completed`)
    
    // Handle no-shows (bookings that are confirmed but client didn't show)
    const noShowBookings = await prisma.serviceRequest.findMany({
      where: {
        isBooking: true,
        status: 'CONFIRMED',
        scheduledAt: {
          lt: subHours(now, 0.5) // 30 minutes past scheduled time
        }
      },
      include: {
        client: true,
        service: true,
        assignedTeamMember: true
      }
    })
    
    // This would typically require manual review, but we can flag them
    for (const booking of noShowBookings) {
      // Could implement automatic no-show logic here
      // For now, just log for manual review
      console.log(`Potential no-show: booking ${booking.uuid}`)
    }
    
    // Cancel expired pending confirmations (older than 24 hours)
    const expiredPending = await prisma.serviceRequest.updateMany({
      where: {
        isBooking: true,
        status: 'PENDING_CONFIRMATION',
        createdAt: {
          lt: subHours(now, 24)
        }
      },
      data: {
        status: 'CANCELLED'
      }
    })
    
    console.log(`Cancelled ${expiredPending.count} expired pending bookings`)
    
  } catch (error) {
    console.error('Booking status update job failed:', error)
    throw error
  }
}

// Enhanced to handle both service requests and bookings
export async function sendAllReminders(): Promise<void> {
  await Promise.all([
    sendBookingReminders(),
    updateBookingStatuses(),
    sendServiceRequestReminders() // existing function for regular service requests
  ])
}
```

---

## Phase 7: Testing Integration

### 7.1 Comprehensive Unit Tests

```typescript
// tests/booking-service-request-integration.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createServiceRequest } from '@/lib/service-requests/creation'
import { getAvailabilitySlots } from '@/lib/service-requests/availability'
import { checkAvailabilityConflicts } from '@/lib/service-requests/validation'
import { sendBookingConfirmation } from '@/lib/email'
import { prisma } from '@/lib/prisma'

// Mock external dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    serviceRequest: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    service: {
      findFirst: vi.fn(),
      findUnique: vi.fn()
    },
    availabilitySlot: {
      findMany: vi.fn()
    }
  }
}))

vi.mock('@/lib/email', () => ({
  sendBookingConfirmation: vi.fn(),
  sendBookingReminder: vi.fn()
}))

describe('Booking Service Request Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Service Request Creation', () => {
    it('should create a regular service request', async () => {
      const mockService = {
        id: 'service1',
        name: 'Tax Consultation',
        duration: 60,
        active: true
      }
      
      const mockUser = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'CLIENT'
      }

      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService)
      vi.mocked(prisma.serviceRequest.create).mockResolvedValue({
        id: 'req1',
        uuid: 'uuid1',
        clientId: 'user1',
        serviceId: 'service1',
        title: 'Tax consultation request',
        isBooking: false,
        status: 'DRAFT'
      } as any)

      const data = {
        clientId: 'user1',
        serviceId: 'service1',
        title: 'Tax consultation request',
        description: 'Need help with 2024 taxes',
        priority: 'MEDIUM' as const,
        isBooking: false
      }

      const result = await createServiceRequest(data, mockUser, 'tenant1')
      
      expect(result.isBooking).toBe(false)
      expect(result.status).toBe('DRAFT')
      expect(prisma.serviceRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isBooking: false,
            status: 'DRAFT'
          })
        })
      )
    })

    it('should create a booking service request with schedule validation', async () => {
      const mockService = {
        id: 'service1',
        name: 'Tax Consultation',
        duration: 60,
        active: true,
        bookingEnabled: true,
        minAdvanceHours: 24,
        advanceBookingDays: 30
      }

      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService)
      vi.mocked(prisma.serviceRequest.findMany).mockResolvedValue([]) // No conflicts
      vi.mocked(prisma.serviceRequest.create).mockResolvedValue({
        id: 'booking1',
        uuid: 'uuid1',
        clientId: 'user1',
        serviceId: 'service1',
        title: 'Tax Consultation - John Doe',
        isBooking: true,
        scheduledAt: new Date('2025-01-15T10:00:00Z'),
        duration: 60,
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        status: 'PENDING_CONFIRMATION'
      } as any)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)

      const data = {
        serviceId: 'service1',
        title: 'Tax Consultation',
        isBooking: true,
        scheduledAt: tomorrow.toISOString(),
        duration: 60,
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        bookingType: 'STANDARD' as const
      }

      const result = await createServiceRequest(data, null, 'tenant1')
      
      expect(result.isBooking).toBe(true)
      expect(result.status).toBe('PENDING_CONFIRMATION')
      expect(result.scheduledAt).toBeDefined()
      expect(sendBookingConfirmation).toHaveBeenCalled()
    })

    it('should reject booking with scheduling conflict', async () => {
      const mockService = {
        id: 'service1',
        name: 'Tax Consultation',
        duration: 60,
        active: true,
        bookingEnabled: true,
        minAdvanceHours: 24
      }

      // Mock existing conflict
      const existingBooking = {
        id: 'existing1',
        scheduledAt: new Date('2025-01-15T10:00:00Z'),
        duration: 60
      }

      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService)
      vi.mocked(prisma.serviceRequest.findMany).mockResolvedValue([existingBooking] as any)

      const data = {
        serviceId: 'service1',
        title: 'Tax Consultation',
        isBooking: true,
        scheduledAt: '2025-01-15T10:30:00Z', // 30-minute overlap
        duration: 60,
        clientName: 'John Doe',
        clientEmail: 'john@example.com'
      }

      await expect(createServiceRequest(data, null, 'tenant1'))
        .rejects.toThrow('Scheduling conflict detected')
    })
  })

  describe('Availability Engine', () => {
    it('should return available slots for a service', async () => {
      const mockService = {
        id: 'service1',
        name: 'Tax Consultation',
        duration: 60,
        businessHours: {
          1: { start: '09:00', end: '17:00' }, // Monday
          2: { start: '09:00', end: '17:00' }  // Tuesday
        }
      }

      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService)
      vi.mocked(prisma.serviceRequest.findMany).mockResolvedValue([])
      vi.mocked(prisma.availabilitySlot.findMany).mockResolvedValue([])

      const startDate = new Date('2025-01-13') // Monday
      const endDate = new Date('2025-01-14')   // Tuesday

      const availability = await getAvailabilitySlots({
        serviceId: 'service1',
        startDate,
        endDate,
        slotDuration: 30
      })

      expect(availability).toHaveLength(2) // 2 days
      expect(availability[0].date).toBe('2025-01-13')
      expect(availability[0].slots.length).toBeGreaterThan(0)
      expect(availability[0].slots[0]).toEqual({
        start: '09:00',
        end: '09:30',
        available: true
      })
    })

    it('should exclude booked slots from availability', async () => {
      const mockService = {
        id: 'service1',
        duration: 60,
        businessHours: {
          1: { start: '09:00', end: '17:00' }
        }
      }

      const existingBooking = {
        id: 'booking1',
        scheduledAt: new Date('2025-01-13T10:00:00Z'),
        duration: 60,
        status: 'CONFIRMED'
      }

      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService)
      vi.mocked(prisma.serviceRequest.findMany).mockResolvedValue([existingBooking] as any)
      vi.mocked(prisma.availabilitySlot.findMany).mockResolvedValue([])

      const startDate = new Date('2025-01-13')
      const endDate = new Date('2025-01-13')

      const availability = await getAvailabilitySlots({
        serviceId: 'service1',
        startDate,
        endDate,
        slotDuration: 30
      })

      // Find the 10:00 and 10:30 slots (should be unavailable due to 1-hour booking)
      const unavailableSlots = availability[0].slots.filter(slot => 
        !slot.available && (slot.start === '10:00' || slot.start === '10:30')
      )

      expect(unavailableSlots.length).toBe(2)
      expect(unavailableSlots[0].reason).toBe('Booked')
    })
  })

  describe('Recurring Bookings', () => {
    it('should create weekly recurring bookings', async () => {
      const parentBooking = {
        id: 'parent1',
        serviceId: 'service1',
        scheduledAt: new Date('2025-01-15T10:00:00Z'),
        duration: 60,
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        tenantId: 'tenant1',
        service: { duration: 60 }
      }

      vi.mocked(prisma.serviceRequest.findUnique).mockResolvedValue(parentBooking as any)
      vi.mocked(prisma.serviceRequest.findMany).mockResolvedValue([]) // No conflicts
      vi.mocked(prisma.serviceRequest.createMany).mockResolvedValue({ count: 4 })

      const pattern = {
        frequency: 'WEEKLY' as const,
        occurrences: 4
      }

      await createRecurringBookings('parent1', pattern)

      expect(prisma.serviceRequest.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            parentBookingId: 'parent1',
            scheduledAt: new Date('2025-01-22T10:00:00Z') // +1 week
          }),
          expect.objectContaining({
            scheduledAt: new Date('2025-01-29T10:00:00Z') // +2 weeks
          })
        ])
      })
    })
  })

  describe('Business Rules Validation', () => {
    it('should enforce minimum advance booking time', async () => {
      const mockService = {
        id: 'service1',
        minAdvanceHours: 24,
        active: true,
        bookingEnabled: true
      }

      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService)

      const tooSoonDate = new Date()
      tooSoonDate.setHours(tooSoonDate.getHours() + 2) // Only 2 hours advance

      const data = {
        serviceId: 'service1',
        scheduledAt: tooSoonDate.toISOString()
      }

      await expect(validateBookingFields(data, 'tenant1'))
        .rejects.toThrow('must be scheduled at least 24 hours in advance')
    })

    it('should enforce business hours', async () => {
      const mockService = {
        id: 'service1',
        businessHours: {
          0: null, // Sunday closed
          1: { start: '09:00', end: '17:00' }
        }
      }

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService)

      // Sunday booking (should fail)
      const sundayDate = new Date('2025-01-12T10:00:00Z') // Sunday
      await expect(validateBusinessHours('service1', sundayDate))
        .rejects.toThrow('not available on this day of the week')

      // Monday before hours (should fail)
      const earlyMondayDate = new Date('2025-01-13T08:00:00Z') // Monday 8 AM
      await expect(validateBusinessHours('service1', earlyMondayDate))
        .rejects.toThrow('only available between 09:00 and 17:00')

      // Monday during hours (should pass)
      const validMondayDate = new Date('2025-01-13T10:00:00Z') // Monday 10 AM
      await expect(validateBusinessHours('service1', validMondayDate))
        .resolves.not.toThrow()
    })
  })

  describe('Email Notifications', () => {
    it('should send booking confirmation with ICS attachment', async () => {
      const booking = {
        id: 'booking1',
        uuid: 'uuid-123',
        isBooking: true,
        scheduledAt: new Date('2025-01-15T10:00:00Z'),
        duration: 60,
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        client: { name: 'John Doe', email: 'john@example.com' },
        service: { name: 'Tax Consultation', description: 'Tax help', duration: 60 },
        assignedTeamMember: { name: 'Jane Smith', email: 'jane@company.com' }
      }

      await sendBookingConfirmation(booking as any)

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'Booking Confirmed: Tax Consultation',
          template: 'booking-confirmation',
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: expect.stringContaining('booking-uuid-123.ics'),
              contentType: 'text/calendar; method=REQUEST'
            })
          ])
        })
      )
    })
  })
})

// tests/booking-api-integration.test.ts
describe('Booking API Integration', () => {
  describe('POST /api/admin/service-requests', () => {
    it('should create booking via unified API', async () => {
      const bookingData = {
        clientId: 'client1',
        serviceId: 'service1',
        title: 'Consultation',
        isBooking: true,
        scheduledAt: '2025-01-15T10:00:00Z',
        duration: 60,
        clientName: 'John Doe',
        clientEmail: 'john@example.com'
      }

      const response = await request(app)
        .post('/api/admin/service-requests')
        .set('Authorization', 'Bearer admin-token')
        .send(bookingData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.isBooking).toBe(true)
      expect(response.body.data.status).toBe('PENDING_CONFIRMATION')
    })

    it('should handle validation errors for bookings', async () => {
      const invalidBookingData = {
        serviceId: 'service1',
        isBooking: true,
        scheduledAt: '2025-01-15T10:00:00Z',
        // Missing required clientName and clientEmail
      }

      const response = await request(app)
        .post('/api/admin/service-requests')
        .set('Authorization', 'Bearer admin-token')
        .send(invalidBookingData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.details).toEqual(
        expect.objectContaining({
          fieldErrors: expect.objectContaining({
            clientName: expect.arrayContaining(['Client name is required']),
            clientEmail: expect.arrayContaining(['Invalid email address'])
          })
        })
      )
    })
  })

  describe('GET /api/admin/service-requests/availability', () => {
    it('should return availability slots', async () => {
      const response = await request(app)
        .get('/api/admin/service-requests/availability')
        .query({
          serviceId: 'service1',
          date: '2025-01-15',
          days: 7
        })
        .set('Authorization', 'Bearer admin-token')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.availability).toBeInstanceOf(Array)
      expect(response.body.data.availability[0]).toEqual(
        expect.objectContaining({
          date: expect.any(String),
          slots: expect.arrayContaining([
            expect.objectContaining({
              start: expect.any(String),
              end: expect.any(String),
              available: expect.any(Boolean)
            })
          ])
        })
      )
    })
  })

  describe('POST /api/admin/service-requests/:id/confirm', () => {
    it('should confirm booking and send email', async () => {
      const response = await request(app)
        .post('/api/admin/service-requests/booking1/confirm')
        .set('Authorization', 'Bearer admin-token')
        .send({})

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.booking.status).toBe('CONFIRMED')
      expect(response.body.data.confirmed).toBe(true)
    })
  })
})
```

### 7.2 Integration Tests

```typescript
// tests/booking-portal-integration.test.ts
describe('Portal Booking Integration', () => {
  describe('Guest Booking Flow', () => {
    it('should allow guest booking creation', async () => {
      const guestBookingData = {
        serviceId: 'service1',
        title: 'Cleaning Service',
        isBooking: true,
        scheduledAt: '2025-01-15T10:00:00Z',
        duration: 120,
        clientName: 'Jane Doe',
        clientEmail: 'jane@example.com',
        clientPhone: '+1234567890',
        requirements: {
          location: {
            area: 'Downtown',
            building: 'Tower A',
            apartment: '12B'
          },
          instructions: 'Please call upon arrival'
        }
      }

      const response = await request(app)
        .post('/api/portal/service-requests')
        .send(guestBookingData)
        // No authorization header for guest booking

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.isBooking).toBe(true)
      expect(response.body.data.clientName).toBe('Jane Doe')
      expect(response.body.data.status).toBe('PENDING_CONFIRMATION')
    })

    it('should enforce rate limiting for guest bookings', async () => {
      const bookingData = {
        serviceId: 'service1',
        isBooking: true,
        scheduledAt: '2025-01-15T10:00:00Z',
        clientName: 'Test User',
        clientEmail: 'test@example.com'
      }

      // Make multiple requests quickly
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/portal/service-requests')
          .send(bookingData)
      )

      const responses = await Promise.all(promises)
      const rateLimited = responses.filter(r => r.status === 429)

      expect(rateLimited.length).toBeGreaterThan(0)
    })
  })
})

// tests/booking-ui-integration.test.ts (using Playwright)
describe('Booking UI Integration', () => {
  test('complete booking flow from home page', async ({ page }) => {
    await page.goto('/')

    // Click on quick booking widget
    await page.click('[data-testid="quick-booking-widget"]')

    // Select service
    await page.click('[data-testid="service-cleaning"]')

    // Select date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.click(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`)

    // Select time slot
    await page.click('[data-testid="time-slot-10:00"]')
    await page.click('[data-testid="next-details"]')

    // Fill location details
    await page.fill('[data-testid="area-input"]', 'Downtown')
    await page.fill('[data-testid="building-input"]', 'Tower A')
    await page.click('[data-testid="next-contact"]')

    // Fill contact information
    await page.fill('[data-testid="name-input"]', 'John Doe')
    await page.fill('[data-testid="email-input"]', 'john@example.com')
    await page.fill('[data-testid="phone-input"]', '+1234567890')

    // Submit booking
    await page.click('[data-testid="confirm-booking"]')

    // Wait for confirmation page
    await page.waitForURL(/\/booking\/confirmation\/.*/)
    
    // Verify confirmation details
    await expect(page.locator('[data-testid="booking-confirmed"]')).toBeVisible()
    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=Downtown')).toBeVisible()
  })

  test('admin booking calendar view', async ({ page }) => {
    await page.goto('/admin/service-requests?type=bookings')

    // Switch to calendar view
    await page.click('[data-testid="calendar-view"]')

    // Should see calendar with bookings
    await expect(page.locator('[data-testid="booking-calendar"]')).toBeVisible()

    // Click on a booking
    await page.click('[data-testid="booking-slot"]:first-child')

    // Should navigate to booking detail
    await page.waitForURL(/\/admin\/service-requests\/.*/)
    await expect(page.locator('[data-testid="booking-details"]')).toBeVisible()
  })

  test('booking confirmation and email', async ({ page }) => {
    await page.goto('/admin/service-requests/booking123')

    // Confirm booking
    await page.click('[data-testid="confirm-booking-btn"]')

    // Wait for success message
    await expect(page.locator('text=Booking Confirmed')).toBeVisible()
    await expect(page.locator('text=Confirmation email sent')).toBeVisible()

    // Status should update
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Confirmed')
  })
})
```

---

## Phase 8: Migration and Deployment

### 8.1 Database Migrations (Sequential)

```sql
-- prisma/migrations/20250920_01_add_booking_fields/migration.sql
-- Add booking fields to service_requests table
ALTER TABLE "service_requests" 
ADD COLUMN "isBooking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "scheduledAt" TIMESTAMP(3),
ADD COLUMN "duration" INTEGER,
ADD COLUMN "clientName" TEXT,
ADD COLUMN "clientEmail" TEXT,
ADD COLUMN "clientPhone" TEXT,
ADD COLUMN "confirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "bookingType" "BookingType" DEFAULT 'STANDARD',
ADD COLUMN "recurringPattern" JSONB,
ADD COLUMN "parentBookingId" TEXT;

-- Add self-referential foreign key for recurring bookings
ALTER TABLE "service_requests" 
ADD CONSTRAINT "service_requests_parentBookingId_fkey" 
FOREIGN KEY ("parentBookingId") REFERENCES "service_requests"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for booking queries
CREATE INDEX "service_requests_scheduledAt_idx" ON "service_requests"("scheduledAt");
CREATE INDEX "service_requests_isBooking_status_idx" ON "service_requests"("isBooking", "status");
CREATE INDEX "service_requests_tenantId_scheduledAt_idx" ON "service_requests"("tenantId", "scheduledAt");
CREATE INDEX "service_requests_tenantId_isBooking_status_idx" ON "service_requests"("tenantId", "isBooking", "status");
CREATE INDEX "service_requests_clientId_isBooking_idx" ON "service_requests"("clientId", "isBooking");
CREATE INDEX "service_requests_assignedTeamMemberId_scheduledAt_idx" ON "service_requests"("assignedTeamMemberId", "scheduledAt");
```

```sql
-- prisma/migrations/20250920_02_add_booking_enums/migration.sql
-- Add new booking-specific status values
ALTER TYPE "RequestStatus" ADD VALUE 'PENDING_CONFIRMATION';
ALTER TYPE "RequestStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "RequestStatus" ADD VALUE 'RESCHEDULED';
ALTER TYPE "RequestStatus" ADD VALUE 'NO_SHOW';
ALTER TYPE "RequestStatus" ADD VALUE 'PARTIALLY_COMPLETED';

-- Create BookingType enum
CREATE TYPE "BookingType" AS ENUM ('STANDARD', 'RECURRING', 'EMERGENCY', 'CONSULTATION');
```

```sql
-- prisma/migrations/20250920_03_enhance_services/migration.sql
-- Add booking-specific fields to services table
ALTER TABLE "services" 
ADD COLUMN "bookingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "advanceBookingDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "minAdvanceHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN "maxDailyBookings" INTEGER,
ADD COLUMN "bufferTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "businessHours" JSONB,
ADD COLUMN "blackoutDates" TIMESTAMP(3)[];

-- Add index for booking-enabled services
CREATE INDEX "services_active_bookingEnabled_idx" ON "services"("active", "bookingEnabled");
```

```sql
-- prisma/migrations/20250920_04_create_availability_slots/migration.sql
-- Create availability_slots table
CREATE TABLE "availability_slots" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "teamMemberId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "maxBookings" INTEGER NOT NULL DEFAULT 1,
    "currentBookings" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_serviceId_fkey" 
FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_teamMemberId_fkey" 
FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "availability_slots_date_serviceId_idx" ON "availability_slots"("date", "serviceId");
CREATE INDEX "availability_slots_teamMemberId_date_idx" ON "availability_slots"("teamMemberId", "date");
CREATE INDEX "availability_slots_available_date_idx" ON "availability_slots"("available", "date");
CREATE UNIQUE INDEX "availability_slots_serviceId_teamMemberId_date_startTime_key" 
ON "availability_slots"("serviceId", "teamMemberId", "date", "startTime");
```

```sql
-- prisma/migrations/20250920_05_enhance_team_members/migration.sql
-- Add booking-specific fields to team_members table
ALTER TABLE "export const BookingServiceRequestSchema = z.object({
  isBooking: z.literal(true),
  clientId: z.string().optional(), // Optional for guest bookings
  serviceId: z.string().min(1, 'Service is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(300, 'Title too long'),
  scheduledAt: z.string().datetime('Invalid date format'),
  duration: z.number().min(15, 'Minimum 15 minutes').max(480, 'Maximum 8 hours').optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().optional(),
  bookingType: z.enum(['STANDARD', 'RECURRING', 'EMERGENCY', 'CONSULTATION']).default('STANDARD'),
  recurringPattern: z.object({
    frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    endDate: z.string().datetime().optional(),
    occurrences: z.number().min(1).max(52).optional()
  }).optional(),
  requirements: z.record(z.string(), z.any()).optional(),
  tenantId: z.string().optional()
})

// Unified create schema using discriminated union
export const CreateServiceRequestSchema = z.discriminatedUnion('isBooking', [
  BaseServiceRequestSchema.extend({ isBooking: z.literal(false).optional() }),
  BookingServiceRequestSchema
])

// Reschedule schema
export const RescheduleBookingSchema = z.object({
  scheduledAt: z.string().datetime('Invalid date format'),
  reason: z.string().max(500, 'Reason too long').optional()
})

// Booking confirmation schema
export const BookingConfirmationSchema = z.object({
  confirmed: z.boolean().default(true),
  notes: z.string().max(1000, 'Notes too long').optional()
})

// Availability query schema
export const AvailabilityQuerySchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  days: z.number().min(1).max(30).default(7),
  teamMemberId: z.string().optional()
})

// Update service request schema
export const UpdateServiceRequestSchema = z.object({
  title: z.string().min(5).max(300).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional(),
  status: z.enum([
    'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'ASSIGNED', 
    'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PENDING_CONFIRMATION', 
    'CONFIRMED', 'RESCHEDULED', 'NO_SHOW', 'PARTIALLY_COMPLETED'
  ]).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  requirements: z.record(z.string(), z.any()).optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(15).max(480).optional(),
  clientPhone: z.string().optional(),
  cancelReason: z.string().max(500).optional()
})
```
```sql
-- prisma/migrations/20250920_05_enhance_team_members/migration.sql
-- Add booking-specific fields to team_members table
ALTER TABLE "team_members" 
ADD COLUMN "workingHours" JSONB,
ADD COLUMN "timeZone" TEXT DEFAULT 'UTC',
ADD COLUMN "maxConcurrentBookings" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "bookingBuffer" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN "autoAssign" BOOLEAN NOT NULL DEFAULT true;

-- Add indexes for booking assignment queries
CREATE INDEX "team_members_isAvailable_status_idx" ON "team_members"("isAvailable", "status");
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");
```

```sql
-- prisma/migrations/20250920_06_create_booking_preferences/migration.sql
-- Create booking_preferences table
CREATE TABLE "booking_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "emailReminder" BOOLEAN NOT NULL DEFAULT true,
    "emailReschedule" BOOLEAN NOT NULL DEFAULT true,
    "emailCancellation" BOOLEAN NOT NULL DEFAULT true,
    "smsReminder" BOOLEAN NOT NULL DEFAULT false,
    "smsConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "reminderHours" INTEGER[] DEFAULT ARRAY[24, 2],
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_preferences_pkey" PRIMARY KEY ("id")
);

-- Add foreign key to users
ALTER TABLE "booking_preferences" ADD CONSTRAINT "booking_preferences_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint
CREATE UNIQUE INDEX "booking_preferences_userId_key" ON "booking_preferences"("userId");
```

### 8.2 Data Migration Script

```typescript
// scripts/migrate-bookings-to-service-requests.ts
import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

interface MigrationStats {
  bookingsMigrated: number
  guestUsersCreated: number
  errorsEncountered: number
  executionTime: number
}

async function migrateExistingBookings(): Promise<MigrationStats> {
  const startTime = performance.now()
  console.log('🚀 Starting booking migration to service requests...')
  
  const stats: MigrationStats = {
    bookingsMigrated: 0,
    guestUsersCreated: 0,
    errorsEncountered: 0,
    executionTime: 0
  }
  
  try {
    // Check if old bookings table exists
    const bookingsExist = await checkBookingsTableExists()
    if (!bookingsExist) {
      console.log('ℹ️  No existing bookings table found. Migration complete.')
      return stats
    }
    
    // Get all existing bookings from old table
    const bookings = await prisma.$queryRaw`SELECT * FROM bookings ORDER BY "createdAt"`
    console.log(`📊 Found ${bookings.length} bookings to migrate`)
    
    if (bookings.length === 0) {
      console.log('✅ No bookings to migrate')
      return stats
    }
    
    // Process bookings in batches to avoid memory issues
    const batchSize = 100
    const batches = Math.ceil(bookings.length / batchSize)
    
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const batch = bookings.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize)
      console.log(`🔄 Processing batch ${batchIndex + 1}/${batches} (${batch.length} items)`)
      
      for (const booking of batch) {
        try {
          await migrateSingleBooking(booking, stats)
        } catch (error) {
          console.error(`❌ Failed to migrate booking ${booking.id}:`, error)
          stats.errorsEncountered++
        }
      }
      
      // Small delay between batches to reduce database load
      if (batchIndex < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log('🧹 Running cleanup tasks...')
    await cleanupAfterMigration()
    
    const endTime = performance.now()
    stats.executionTime = endTime - startTime
    
    console.log('✅ Migration completed successfully!')
    console.log(`📈 Stats:
    - Bookings migrated: ${stats.bookingsMigrated}
    - Guest users created: ${stats.guestUsersCreated}
    - Errors encountered: ${stats.errorsEncountered}
    - Execution time: ${Math.round(stats.executionTime)}ms`)
    
    return stats
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  }
}

async function checkBookingsTableExists(): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings'
      )
    `
    return result[0]?.exists || false
  } catch {
    return false
  }
}

async function migrateSingleBooking(booking: any, stats: MigrationStats): Promise<void> {
  // Ensure client exists - create guest user if needed
  let clientId = booking.clientId
  
  if (!clientId && booking.clientEmail) {
    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email: booking.clientEmail }
    })
    
    if (existingUser) {
      clientId = existingUser.id
    } else {
      // Create guest user
      const guestUser = await prisma.user.create({
        data: {
          email: booking.clientEmail,
          name: booking.clientName || 'Guest User',
          role: 'CLIENT',
          emailVerified: null, // Guest users are not verified
          // Add tenant if available
          ...(booking.tenantId && { tenantId: booking.tenantId })
        }
      })
      clientId = guestUser.id
      stats.guestUsersCreated++
      console.log(`👤 Created guest user for ${booking.clientEmail}`)
    }
  }
  
  if (!clientId) {
    throw new Error(`No client ID available for booking ${booking.id}`)
  }
  
  // Map booking status to service request status
  const statusMapping = {
    'PENDING': 'PENDING_CONFIRMATION',
    'CONFIRMED': 'CONFIRMED',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
    'NO_SHOW': 'NO_SHOW'
  }
  
  const mappedStatus = statusMapping[booking.status] || 'PENDING_CONFIRMATION'
  
  // Create service request from booking
  await prisma.serviceRequest.create({
    data: {
      // Core fields
      clientId,
      serviceId: booking.serviceId,
      title: `${booking.service?.name || 'Service'} - ${booking.clientName}`,
      description: booking.notes,
      status: mappedStatus,
      priority: 'MEDIUM', // Default priority for migrated bookings
      
      // Booking-specific fields
      isBooking: true,
      scheduledAt: booking.scheduledAt,
      duration: booking.duration,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      confirmed: booking.confirmed || false,
      reminderSent: booking.reminderSent || false,
      bookingType: 'STANDARD', // Default for migrated bookings
      
      // Assignment
      assignedTeamMemberId: booking.assignedTeamMemberId,
      assignedAt: booking.assignedTeamMemberId ? booking.updatedAt : null,
      
      // Completion
      completedAt: mappedStatus === 'COMPLETED' ? booking.updatedAt : null,
      
      // Timestamps
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      
      // Tenant
      ...(booking.tenantId && { tenantId: booking.tenantId })
    }
  })
  
  stats.bookingsMigrated++
  
  if (stats.bookingsMigrated % 50 === 0) {
    console.log(`✅ Migrated ${stats.bookingsMigrated} bookings so far...`)
  }
}

async function cleanupAfterMigration(): Promise<void> {
  try {
    // Update any missing service durations
    await prisma.$executeRaw`
      UPDATE service_requests sr 
      SET duration = s.duration 
      FROM services s 
      WHERE sr."serviceId" = s.id 
      AND sr."isBooking" = true 
      AND sr.duration IS NULL
    `
    
    // Set default booking preferences for new guest users
    const usersWithoutPreferences = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        bookingPreferences: null
      },
      select: { id: true }
    })
    
    if (usersWithoutPreferences.length > 0) {
      await prisma.bookingPreferences.createMany({
        data: usersWithoutPreferences.map(user => ({
          userId: user.id,
          emailConfirmation: true,
          emailReminder: true,
          reminderHours: [24, 2]
        }))
      })
      console.log(`🎯 Created booking preferences for ${usersWithoutPreferences.length} users`)
    }
    
    // Update service booking settings
    await prisma.service.updateMany({
      where: { bookingEnabled: { equals: null } },
      data: { bookingEnabled: true }
    })
    
    console.log('🧹 Cleanup completed')
  } catch (error) {
    console.warn('⚠️  Some cleanup tasks failed:', error)
  }
}

// Verification function
async function verifyMigration(): Promise<void> {
  console.log('🔍 Verifying migration results...')
  
  const [
    totalServiceRequests,
    totalBookings,
    confirmedBookings,
    guestUsers
  ] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({ where: { isBooking: true } }),
    prisma.serviceRequest.count({ 
      where: { isBooking: true, status: 'CONFIRMED' }
    }),
    prisma.user.count({ where: { role: 'CLIENT' } })
  ])
  
  console.log(`📊 Migration verification:
  - Total service requests: ${totalServiceRequests}
  - Bookings (isBooking=true): ${totalBookings}
  - Confirmed bookings: ${confirmedBookings}
  - Client users: ${guestUsers}`)
  
  // Check for data integrity issues
  const orphanedBookings = await prisma.serviceRequest.count({
    where: {
      isBooking: true,
      OR: [
        { clientId: null },
        { serviceId: null },
        { scheduledAt: null }
      ]
    }
  })
  
  if (orphanedBookings > 0) {
    console.warn(`⚠️  Found ${orphanedBookings} bookings with missing required data`)
  } else {
    console.log('✅ All bookings have required data')
  }
}

// Rollback function (in case of issues)
async function rollbackMigration(): Promise<void> {
  console.log('🔄 Rolling back migration...')
  
  const result = await prisma.serviceRequest.deleteMany({
    where: { isBooking: true }
  })
  
  console.log(`🗑️  Deleted ${result.count} migrated bookings`)
  
  // Optionally remove guest users created during migration
  // Note: This should be done carefully to avoid removing legitimate users
  const guestUsers = await prisma.user.deleteMany({
    where: {
      role: 'CLIENT',
      emailVerified: null,
      serviceRequestsAsClient: { none: {} }
    }
  })
  
  console.log(`👤 Removed ${guestUsers.count} unused guest users`)
  console.log('↩️  Rollback completed')
}

// CLI interface
async function main() {
  const command = process.argv[2]
  
  try {
    switch (command) {
      case 'migrate':
        await migrateExistingBookings()
        await verifyMigration()
        break
      case 'verify':
        await verifyMigration()
        break
      case 'rollback':
        await rollbackMigration()
        break
      default:
        console.log(`
Usage: npm run migrate:bookings <command>

Commands:
  migrate   - Migrate existing bookings to service requests
  verify    - Verify migration results
  rollback  - Rollback migration (removes migrated data)
        `)
    }
  } catch (error) {
    console.error('Migration script failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { migrateExistingBookings, verifyMigration, rollbackMigration }
```

### 8.3 Deployment Configuration

```bash
# .env.example (updated)
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database"
NETLIFY_DATABASE_URL="postgresql://username:password@host:5432/database"
NETLIFY_DATABASE_URL_UNPOOLED="postgresql://username:password@host:5432/database?pgbouncer=false"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Booking Integration
ENABLE_BOOKING_INTEGRATION=true
BOOKING_BUSINESS_HOURS_START="09:00"
BOOKING_BUSINESS_HOURS_END="17:00"
BOOKING_SLOT_DURATION_MINUTES=30
BOOKING_BUFFER_MINUTES=15
BOOKING_REMINDER_HOURS=24
BOOKING_AUTO_CONFIRM_HOURS=2

# File Storage
UPLOADS_PROVIDER="netlify"
NETLIFY_BLOBS_TOKEN="your-netlify-blobs-token"

# Realtime
REALTIME_TRANSPORT="postgres"
REALTIME_PG_URL="${DATABASE_URL}"
REALTIME_PG_CHANNEL="service_requests_realtime"

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password"
SUPPORT_EMAIL="support@example.com"
SUPPORT_PHONE="+1 (555) 123-4567"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"

# Feature Flags
MULTI_TENANCY_ENABLED=false
BOOKING_CALENDAR_VIEW_ENABLED=true
RECURRING_BOOKINGS_ENABLED=true
GUEST_BOOKING_ENABLED=true
```

```toml
# netlify.toml (updated)
[build]
  command = '''
    if [ "$NETLIFY_DATABASE_URL" != "" ]; then
      echo "Running database migrations and seeds..."
      npm run db:generate
      npm run db:migrate
      npm run db:seed
    fi
    npm run build
  '''
  publish = ".next"

[build.environment]
  NPM_FLAGS = "--prefer-offline --no-audit"
  PRISMA_MIGRATION_ENGINE_ADVISORY_LOCK_TIMEOUT = "60000"
  SECRETS_SCAN_OMIT_KEYS = "UPLOADS_PROVIDER,REALTIME_TRANSPORT,BOOKING_BUSINESS_HOURS_START,BOOKING_BUSINESS_HOURS_END"
  NODE_OPTIONS = "--max_old_space_size=4096"

# Skip migrations for preview deployments to avoid DB conflicts
[context.deploy-preview.build]
  command = "npm run build"

[context.branch-deploy.build]
  command = "npm run build"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "nft"
  
[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-store, no-cache, must-revalidate"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/api/bookings/*"
  to = "/api/admin/service-requests/:splat"
  status = 301
  headers = {X-API-Deprecated = "true", X-API-Migration-Guide = "/docs/api-migration"}
```

```json
// package.json (updated scripts)
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force",
    "migrate:bookings": "tsx scripts/migrate-bookings-to-service-requests.ts",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## Phase 9: File Changes Summary

### Files to Create/Modify

**New Components (Booking Integration):**
- `src/components/home/QuickBookingWidget.tsx` - Home page booking widget
- `src/components/home/HowItWorksSection.tsx` - Process explanation
- `src/components/home/MobileBookingButton.tsx` - Mobile floating button
- `src/components/service-requests/BookingCalendarView.tsx` - Admin calendar view
- `src/components/service-requests/AvailabilityPicker.tsx` - Availability selection
- `src/components/service-requests/BookingActions.tsx` - Booking action buttons
- `src/components/service-requests/StatusBadge.tsx` - Unified status display
- `src/components/service-requests/ServiceRequestCard.tsx` - Unified card component
- `src/app/booking/confirmation/[id]/page.tsx` - Booking confirmation page
- `src/app/admin/service-requests/availability/page.tsx` - Availability management

**Enhanced Components (Service Request Integration):**
- `src/app/admin/service-requests/page.tsx` - Add booking views and filters
- `src/app/admin/service-requests/new/page.tsx` - Add booking creation mode
- `src/app/admin/service-requests/[id]/page.tsx` - Add booking-specific sections
- `src/app/portal/service-requests/page.tsx` - Add booking view toggle
- `src/app/portal/service-requests/new/page.tsx` - Support booking creation
- `src/app/portal/service-requests/[id]/page.tsx` - Add booking actions
- `src/components/admin/service-requests/table.tsx` - Add booking columns
- `src/components/admin/service-requests/filters.tsx` - Add booking filters
- `src/components/admin/service-requests/overview.tsx` - Add booking metrics

**API Enhancements:**
- `src/app/api/admin/service-requests/route.ts` - Enhanced CREATE/GET for bookings
- `src/app/api/admin/service-requests/[id]/route.ts` - Booking-specific updates
- `src/app/api/admin/service-requests/[id]/confirm/route.ts` - NEW booking confirmation
- `src/app/api/admin/service-requests/[id]/reschedule/route.ts` - NEW reschedule endpoint
- `src/app/api/admin/service-requests/availability/route.ts` - NEW availability endpoint
- `src/app/api/portal/service-requests/route.ts` - Support guest booking creation
- `src/app/api/portal/service-requests/[id]/route.ts` - Add booking actions

**Backward Compatibility:**
- `src/app/api/bookings/route.ts` - Forward to service-requests (deprecated)
- `src/app/api/bookings/[id]/route.ts` - Forward to service-requests (deprecated)
- `src/app/api/bookings/availability/route.ts` - Forward to availability (deprecated)
- `src/app/api/bookings/[id]/confirm/route.ts` - Forward to confirm (deprecated)

**Business Logic & Validation:**
- `src/lib/schemas/service-requests.ts` - Add booking validation schemas
- `src/lib/service-requests/validation.ts` - Enhanced validation with booking rules
- `src/lib/service-requests/availability.ts` - NEW availability engine
- `src/lib/service-requests/assignment.ts` - Enhanced auto-assignment
- `src/lib/email.ts` - Enhanced email system with booking templates
- `src/lib/cron.ts` - Enhanced cron with booking reminders

**Hooks & State Management:**
- `src/hooks/useServiceRequests.ts` - Enhanced for booking filtering
- `src/hooks/useAvailability.ts` - NEW availability hook
- `src/hooks/useBookingActions.ts` - NEW booking actions hook

**Database & Configuration:**
- `prisma/schema.prisma` - Enhanced ServiceRequest model, new AvailabilitySlot, BookingPreferences
- `prisma/migrations/20250920_*/migration.sql` - Sequential migration files
- `scripts/migrate-bookings-to-service-requests.ts` - Data migration script
- `netlify.toml` - Enhanced deployment configuration
- `.env.example` - Updated environment variables

**Testing:**
- `tests/booking-service-request-integration.test.ts` - Comprehensive unit tests
- `tests/booking-api-integration.test.ts` - API integration tests
- `tests/booking-portal-integration.test.ts` - Portal integration tests
- `tests/booking-ui-integration.test.ts` - UI/E2E tests with Playwright

**Public Integration:**
- `src/app/page.tsx` - Enhanced home page with booking widget
- `src/app/booking/page.tsx` - Integrate with service request API
- `src/components/ui/navigation.tsx` - Add prominent "Book Now" button
- `src/app/layout.tsx` - Include MobileBookingButton

### Files to Remove (After Transition)

**Deprecated Booking Files (90-day transition period):**
- `src/app/admin/bookings/` - Migrate features to service-requests
- `src/app/portal/bookings/` - Migrate features to service-requests
- `src/components/admin/bookings/` - Merge into service-requests components
- `src/lib/bookings/` - If exists, merge into service-requests lib

**Migration Strategy:**
1. Keep booking API routes as compatibility layer
2. Add deprecation warnings and migration guides
3. Monitor usage analytics during transition
4. Remove deprecated files after 90 days and usage drops below 5%

---

## Phase 15: Security and Performance Optimization

### 15.1 Security Enhancements

**Input Validation and Sanitization:**
```typescript
// src/lib/security/validation.ts
import { rateLimit } from '@/lib/rate-limit'
import { sanitize } from 'dompurify'

export async function validateBookingInput(data: any, request: Request): Promise<void> {
  // Rate limiting per IP for guest bookings
  if (!data.clientId) {
    await rateLimit(request, 'guest-booking', {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000 // 1 hour
    })
  }
  
  // Sanitize HTML content in requirements
  if (data.requirements && typeof data.requirements === 'object') {
    for (const key in data.requirements) {
      if (typeof data.requirements[key] === 'string') {
        data.requirements[key] = sanitize(data.requirements[key])
      }
    }
  }
  
  // Validate scheduling constraints to prevent abuse
  const scheduledAt = new Date(data.scheduledAt)
  const maxAdvanceMonths = 6
  const maxAdvanceDate = new Date()
  maxAdvanceDate.setMonth(maxAdvanceDate.getMonth() + maxAdvanceMonths)
  
  if (scheduledAt > maxAdvanceDate) {
    throw new Error(`Bookings cannot be scheduled more than ${maxAdvanceMonths} months in advance`)
  }
}

// CSRF Protection for booking endpoints
export function validateCSRFToken(request: Request, expectedToken: string): boolean {
  const token = request.headers.get('X-CSRF-Token')
  return token === expectedToken
}
```

**Enhanced RBAC for Booking Operations:**
```typescript
// src/lib/permissions/booking-permissions.ts
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const BOOKING_PERMISSIONS = {
  ...PERMISSIONS,
  BOOKING_CREATE: 'booking:create',
  BOOKING_CONFIRM: 'booking:confirm',
  BOOKING_RESCHEDULE: 'booking:reschedule',
  BOOKING_CANCEL: 'booking:cancel',
  BOOKING_VIEW_ALL: 'booking:view_all',
  BOOKING_MANAGE_AVAILABILITY: 'booking:manage_availability'
} as const

export const BOOKING_ROLE_PERMISSIONS = {
  CLIENT: [
    BOOKING_PERMISSIONS.BOOKING_CREATE,
    BOOKING_PERMISSIONS.SERVICE_REQUESTS_READ_OWN
  ],
  TEAM_MEMBER: [
    ...CLIENT_PERMISSIONS,
    BOOKING_PERMISSIONS.BOOKING_VIEW_ALL,
    BOOKING_PERMISSIONS.BOOKING_RESCHEDULE
  ],
  TEAM_LEAD: [
    ...TEAM_MEMBER_PERMISSIONS,
    BOOKING_PERMISSIONS.BOOKING_CONFIRM,
    BOOKING_PERMISSIONS.BOOKING_CANCEL,
    BOOKING_PERMISSIONS.BOOKING_MANAGE_AVAILABILITY
  ],
  ADMIN: Object.values(BOOKING_PERMISSIONS)
}
```

### 15.2 Performance Optimizations

**Database Query Optimization:**
```typescript
// src/lib/service-requests/queries.ts
export async function getOptimizedServiceRequests(filters: any) {
  // Use database views for complex booking queries
  const query = `
    WITH booking_stats AS (
      SELECT 
        sr.id,
        sr.title,
        sr.status,
        sr.scheduled_at,
        sr.is_booking,
        u.name as client_name,
        u.email as client_email,
        s.name as service_name,
        tm.name as team_member_name,
        -- Calculate derived fields in database
        CASE 
          WHEN sr.scheduled_at < NOW() AND sr.status = 'CONFIRMED' 
          THEN 'OVERDUE'
          ELSE sr.status 
        END as computed_status,
        -- Index-optimized sorting
        COALESCE(sr.scheduled_at, sr.created_at) as sort_date
      FROM service_requests sr
      LEFT JOIN users u ON sr.client_id = u.id
      LEFT JOIN services s ON sr.service_id = s.id
      LEFT JOIN team_members tm ON sr.assigned_team_member_id = tm.id
      WHERE ($1::boolean IS NULL OR sr.is_booking = $1)
        AND ($2::text IS NULL OR sr.status = ANY($2::text[]))
        AND ($3::text IS NULL OR sr.tenant_id = $3)
      ORDER BY sort_date DESC, sr.created_at DESC
      LIMIT $4 OFFSET $5
    )
    SELECT * FROM booking_stats
  `
  
  return await prisma.$queryRaw(query, [
    filters.isBooking,
    filters.status,
    filters.tenantId,
    filters.limit,
    filters.offset
  ])
}
```

**Caching Strategy:**
```typescript
// src/lib/cache/availability-cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function getCachedAvailability(
  serviceId: string, 
  date: string
): Promise<any[] | null> {
  const cacheKey = `availability:${serviceId}:${date}`
  const cached = await redis.get(cacheKey)
  return cached ? JSON.parse(cached) : null
}

export async function setCachedAvailability(
  serviceId: string,
  date: string,
  availability: any[]
): Promise<void> {
  const cacheKey = `availability:${serviceId}:${date}`
  // Cache for 15 minutes
  await redis.setex(cacheKey, 900, JSON.stringify(availability))
}

export async function invalidateAvailabilityCache(serviceId: string, date: string): Promise<void> {
  const pattern = `availability:${serviceId}:${date}*`
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

---

## Phase 16: Accessibility and Internationalization

### 16.1 Accessibility Enhancements

```typescript
// src/components/service-requests/AccessibleBookingWidget.tsx
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AccessibleBookingWidget() {
  const titleId = useId()
  const stepId = useId()
  
  return (
    <Card role="form" aria-labelledby={titleId} aria-describedby={stepId}>
      <CardHeader>
        <CardTitle id={titleId}>Book Your Service</CardTitle>
        <p id={stepId} className="sr-only">
          Step {currentStep} of 4: {getStepDescription(currentStep)}
        </p>
      </CardHeader>
      
      <CardContent>
        {/* Service Selection with proper ARIA labels */}
        <fieldset>
          <legend className="text-lg font-medium mb-4">Choose Your Service</legend>
          {services.map((service) => (
            <div key={service.id} className="relative">
              <input
                type="radio"
                id={`service-${service.id}`}
                name="selectedService"
                value={service.id}
                className="sr-only"
                aria-describedby={`service-${service.id}-description`}
                onChange={() => handleServiceSelect(service.id)}
              />
              <label
                htmlFor={`service-${service.id}`}
                className="block p-4 border rounded-lg cursor-pointer focus-within:ring-2 focus-within      console.log(`Found ${bookings.length} bookings needing ${hours}-hour reminders`)
      
      for (const booking of bookings) {
        try {
          await sendBookingReminder(booking as any, hours)
          
          // Mark reminder as sent only for 24-hour reminders
          // 2-hour reminders don't update the flag to allow multiple reminders
          if (hours === 24) {
            await prisma.serviceRequest.update({
              where: { id: booking.id },
              data: { reminderSent: true }
            })
          }
          
          console.log(`Sent ${hours}-hour reminder for booking ${booking.uuid}`)
        } catch (error) {
          console.error(`Failed to send reminder for booking ${booking.uuid}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('Booking reminder job failed:', error)
    throw error
  }
}

export async function updateBookingStatuses(): Promise<void> {
  console.log('Starting booking status update job...')
  
  try {
    const now = new Date()
    
    // Mark past confirmed bookings as completed
    const completedBookings = await prisma.serviceRequest.updateMany({
      where: {
        isBooking: true,
        status: 'CONFIRMED',
        scheduledAt: {
          lt: subHours(now, 2) // 2 hours past scheduled time
        }
      },
      data: {
        status: 'COMPLETED',
        completedAt: now
      }
    })
    
    console.log(`Marked ${completedBookings.count} bookings as completed`)
    
    // Handle no-shows (bookings that are confirmed but client didn't show)
    const noShowBookings = await prisma.serviceRequest.findMany({
      where: {
        isBooking: true,
        status: 'CONFIRMED',
        scheduledAt: {
          lt: subHours(now, 0.5) // 30 minutes past scheduled time
        }
      },
      include: {
        client: true,
        service: true,
        assignedTeamMember: true
      }
    })
    
    // This would typically require manual review, but we can flag them
    for (const booking of noShowBookings) {
      // Could implement automatic no-show logic here
      // For now, just log for manual review
      console.log(`Potential no-show: booking ${booking.uuid}`)
    }
    
    // Cancel expired pending confirmations (older than 24 hours)
    const expiredPending = await prisma.serviceRequest.updateMany({
      where: {
        isBooking: true,
        status: 'PENDING_CONFIRMATION',
        createdAt: {
          lt: subHours(now, 24)
        }
      },
      data: {
        status: 'CANCELLED'
      }
    })
    
    console.log(`Cancelled ${expiredPending.count} expired pending bookings`)
    
  } catch (error) {
    console.error('Booking status update job failed:', error)
    throw error
  }
}

// Enhanced to handle both service requests and bookings
export async function sendAllReminders(): Promise<void> {
  await Promise.all([
    sendBookingReminders(),
    updateBookingStatuses(),
    sendServiceRequestReminders() // existing function for regular service requests
  ])
}
```

---
className="block p-4 border rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-primary"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl" aria-hidden="true">{service.icon}</span>
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div id={`service-${service.id}-description`} className="text-sm text-muted-foreground">
                      {service.description}
                    </div>
                  </div>
                </div>
              </label>
            </div>
          ))}
        </fieldset>
        
        {/* Calendar with keyboard navigation */}
        <div role="application" aria-label="Date and time selection">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date() || !isDateAvailable(date)}
            aria-label="Select booking date"
            className="rounded-md border"
          />
          
          {/* Screen reader announcements */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {selectedDate && `Selected date: ${selectedDate.toLocaleDateString()}`}
          </div>
        </div>
        
        {/* Form validation errors */}
        {errors.length > 0 && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Please correct the following errors:</h3>
            <ul className="mt-2 list-disc list-inside text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 16.2 Internationalization Setup

```typescript
// src/lib/i18n/config.ts
export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'ar', 'fr', 'es']
} as const

export type Locale = typeof i18n.locales[number]

// src/lib/i18n/dictionaries.ts
const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  ar: () => import('./dictionaries/ar.json').then((module) => module.default),
  fr: () => import('./dictionaries/fr.json').then((module) => module.default),
  es: () => import('./dictionaries/es.json').then((module) => module.default)
}

export const getDictionary = async (locale: Locale) => dictionaries[locale]()

// src/lib/i18n/dictionaries/en.json
{
  "booking": {
    "title": "Book Your Service",
    "steps": {
      "service": "Choose Service",
      "datetime": "Select Date & Time",
      "details": "Location Details",
      "contact": "Contact Information"
    },
    "form": {
      "clientName": "Full Name",
      "clientEmail": "Email Address",
      "clientPhone": "Phone Number",
      "area": "Area/District",
      "building": "Building Name",
      "requirements": "Additional Requirements",
      "submit": "Confirm Booking",
      "cancel": "Cancel",
      "back": "Back",
      "next": "Next"
    },
    "validation": {
      "required": "This field is required",
      "email": "Please enter a valid email address",
      "phone": "Please enter a valid phone number",
      "dateInPast": "Please select a future date",
      "timeUnavailable": "Selected time is not available"
    },
    "status": {
      "pending": "Pending Confirmation",
      "confirmed": "Confirmed",
      "completed": "Completed",
      "cancelled": "Cancelled",
      "rescheduled": "Rescheduled",
      "no_show": "No Show"
    },
    "messages": {
      "confirmationSent": "Booking confirmed! Confirmation email sent.",
      "rescheduled": "Booking successfully rescheduled",
      "cancelled": "Booking has been cancelled"
    }
  },
  "calendar": {
    "previousMonth": "Previous month",
    "nextMonth": "Next month",
    "selectDate": "Select date",
    "today": "Today",
    "unavailable": "Date unavailable"
  },
  "time": {
    "format": "12h",
    "morning": "AM",
    "afternoon": "PM"
  }
}

// src/lib/i18n/dictionaries/ar.json
{
  "booking": {
    "title": "احجز خدمتك",
    "steps": {
      "service": "اختر الخدمة",
      "datetime": "حدد التاريخ والوقت",
      "details": "تفاصيل الموقع",
      "contact": "معلومات الاتصال"
    },
    "form": {
      "clientName": "الاسم الكامل",
      "clientEmail": "عنوان البريد الإلكتروني",
      "clientPhone": "رقم الهاتف",
      "area": "المنطقة/المحافظة",
      "building": "اسم المبنى",
      "requirements": "متطلبات إضافية",
      "submit": "تأكيد الحجز",
      "cancel": "إلغاء",
      "back": "رجوع",
      "next": "التالي"
    }
  }
}
```

**Localized Booking Component:**
```typescript
// src/components/booking/LocalizedBookingWidget.tsx
import { getDictionary } from '@/lib/i18n/dictionaries'
import { formatDate, formatTime } from '@/lib/i18n/formatting'

interface LocalizedBookingWidgetProps {
  locale: Locale
  dictionary: any
  direction: 'ltr' | 'rtl'
}

export function LocalizedBookingWidget({ locale, dictionary, direction }: LocalizedBookingWidgetProps) {
  return (
    <div dir={direction} className={direction === 'rtl' ? 'text-right' : 'text-left'}>
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.booking.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step indicator with RTL support */}
          <div className="flex items-center justify-between">
            {dictionary.booking.steps.map((step, index) => (
              <div key={step} className={`flex items-center ${direction === 'rtl' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <span className="text-sm font-medium">{step}</span>
              </div>
            ))}
          </div>
          
          {/* Date formatting based on locale */}
          {selectedDate && (
            <div className="text-lg font-medium">
              {formatDate(selectedDate, locale)}
            </div>
          )}
          
          {/* Time slots with locale-appropriate formatting */}
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((slot) => (
              <Button
                key={slot}
                variant={selectedTime === slot ? "default" : "outline"}
                onClick={() => setSelectedTime(slot)}
              >
                {formatTime(slot, locale)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Phase 17: Analytics and Business Intelligence

### 17.1 Enhanced Analytics

```typescript
// src/lib/analytics/booking-metrics.ts
export interface BookingMetrics {
  totalBookings: number
  confirmedBookings: number
  completedBookings: number
  cancelledBookings: number
  noShowBookings: number
  conversionRate: number
  averageBookingValue: number
  recurringBookingsCount: number
  peakHours: { hour: number; count: number }[]
  popularServices: { serviceId: string; serviceName: string; count: number }[]
  teamMemberPerformance: { teamMemberId: string; name: string; completionRate: number }[]
}

export async function getBookingAnalytics(
  startDate: Date,
  endDate: Date,
  tenantId?: string
): Promise<BookingMetrics> {
  const baseWhere = {
    isBooking: true,
    createdAt: {
      gte: startDate,
      lte: endDate
    },
    ...(tenantId && isMultiTenancyEnabled() ? { tenantId } : {})
  }
  
  const [
    totalBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    noShowBookings,
    recurringBookingsCount,
    bookingsByHour,
    bookingsByService,
    teamMemberStats
  ] = await Promise.all([
    prisma.serviceRequest.count({ where: baseWhere }),
    prisma.serviceRequest.count({ where: { ...baseWhere, status: 'CONFIRMED' } }),
    prisma.serviceRequest.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
    prisma.serviceRequest.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
    prisma.serviceRequest.count({ where: { ...baseWhere, status: 'NO_SHOW' } }),
    prisma.serviceRequest.count({ where: { ...baseWhere, bookingType: 'RECURRING' } }),
    
    // Hour analysis
    prisma.$queryRaw`
      SELECT EXTRACT(HOUR FROM "scheduledAt") as hour, COUNT(*) as count
      FROM service_requests 
      WHERE "isBooking" = true 
        AND "scheduledAt" BETWEEN ${startDate} AND ${endDate}
        ${tenantId ? Prisma.sql`AND "tenantId" = ${tenantId}` : Prisma.empty}
      GROUP BY EXTRACT(HOUR FROM "scheduledAt")
      ORDER BY count DESC
    `,
    
    // Service popularity
    prisma.serviceRequest.groupBy({
      by: ['serviceId'],
      where: baseWhere,
      _count: true,
      orderBy: { _count: { serviceId: 'desc' } },
      take: 10
    }),
    
    // Team member performance
    prisma.$queryRaw`
      SELECT 
        tm.id as "teamMemberId",
        tm.name,
        COUNT(sr.id) as "totalAssigned",
        COUNT(CASE WHEN sr.status = 'COMPLETED' THEN 1 END) as completed,
        (COUNT(CASE WHEN sr.status = 'COMPLETED' THEN 1 END)::float / COUNT(sr.id)::float * 100) as "completionRate"
      FROM team_members tm
      LEFT JOIN service_requests sr ON tm.id = sr."assignedTeamMemberId"
      WHERE sr."isBooking" = true 
        AND sr."createdAt" BETWEEN ${startDate} AND ${endDate}
        ${tenantId ? Prisma.sql`AND sr."tenantId" = ${tenantId}` : Prisma.empty}
      GROUP BY tm.id, tm.name
      HAVING COUNT(sr.id) > 0
      ORDER BY "completionRate" DESC
    `
  ])
  
  // Get service names
  const serviceIds = bookingsByService.map(item => item.serviceId)
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true, price: true }
  })
  
  const popularServices = bookingsByService.map(item => {
    const service = services.find(s => s.id === item.serviceId)
    return {
      serviceId: item.serviceId,
      serviceName: service?.name || 'Unknown Service',
      count: item._count
    }
  })
  
  // Calculate average booking value
  const totalValue = await prisma.serviceRequest.aggregate({
    where: baseWhere,
    _avg: {
      // This would need to be calculated based on service prices
    }
  })
  
  const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0
  
  return {
    totalBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    noShowBookings,
    conversionRate: Math.round(conversionRate * 100) / 100,
    averageBookingValue: 0, // Calculate based on service prices
    recurringBookingsCount,
    peakHours: bookingsByHour.map(item => ({
      hour: Number(item.hour),
      count: Number(item.count)
    })),
    popularServices,
    teamMemberPerformance: teamMemberStats.map(item => ({
      teamMemberId: item.teamMemberId,
      name: item.name,
      completionRate: Number(item.completionRate) || 0
    }))
  }
}
```

**Analytics Dashboard Component:**
```typescript
// src/components/admin/analytics/BookingAnalyticsDashboard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, LineChart, PieChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function BookingAnalyticsDashboard({ metrics }: { metrics: BookingMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Key Metrics Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Total Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.totalBookings}</div>
          <div className="text-sm text-muted-foreground">
            {metrics.confirmedBookings} confirmed ({metrics.conversionRate}% conversion)
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {metrics.confirmedBookings > 0 
              ? Math.round((metrics.completedBookings / metrics.confirmedBookings) * 100)
              : 0}%
          </div>
          <div className="text-sm text-muted-foreground">
            {metrics.completedBookings} of {metrics.confirmedBookings} bookings completed
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>No-Show Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            {metrics.confirmedBookings > 0 
              ? Math.round((metrics.noShowBookings / metrics.confirmedBookings) * 100)
              : 0}%
          </div>
          <div className="text-sm text-muted-foreground">
            {metrics.noShowBookings} no-shows
          </div>
        </CardContent>
      </Card>
      
      {/* Peak Hours Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Peak Booking Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => `Hour: ${value}:00`}
                formatter={(value) => [value, 'Bookings']}
              />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Popular Services */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.popularServices.slice(0, 5).map((service, index) => (
              <div key={service.serviceId} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-medium">{service.serviceName}</span>
                </div>
                <span className="text-sm font-bold">{service.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Team Performance */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Team Member Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.teamMemberPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
              <Bar dataKey="completionRate" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Phase 18: Integration Testing and Quality Assurance

### 18.1 Comprehensive E2E Test Suite

```typescript
// tests/e2e/booking-integration.spec.ts
import { test, expect, Page } from '@playwright/test'

test.describe('Booking Integration E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    // Setup test data
    await setupTestData()
  })

  test('Complete guest booking flow', async () => {
    await page.goto('/')
    
    // Step 1: Navigate to booking widget
    await page.getByTestId('quick-booking-widget').click()
    
    // Step 2: Select service
    await page.getByTestId('service-cleaning').click()
    await expect(page.getByTestId('selected-service')).toContainText('Home Cleaning')
    
    // Step 3: Select date and time
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateSelector = `[data-date="${tomorrow.toISOString().split('T')[0]}"]`
    await page.click(dateSelector)
    
    await page.getByTestId('time-slot-10:00').click()
    await page.getByTestId('next-details').click()
    
    // Step 4: Fill location details
    await page.getByTestId('area-input').fill('Dubai Marina')
    await page.getByTestId('building-input').fill('Marina Walk')
    await page.getByTestId('apartment-input').fill('Apt 1201')
    await page.getByTestId('requirements-input').fill('Please call before arrival')
    await page.getByTestId('next-contact').click()
    
    // Step 5: Fill contact information
    await page.getByTestId('name-input').fill('John Doe')
    await page.getByTestId('email-input').fill('john.doe@example.com')
    await page.getByTestId('phone-input').fill('+971501234567')
    
    // Step 6: Submit booking
    await page.getByTestId('confirm-booking').click()
    
    // Verify confirmation page
    await expect(page).toHaveURL(/\/booking\/confirmation\/.*/)
    await expect(page.getByTestId('booking-confirmed')).toBeVisible()
    await expect(page.getByText('John Doe')).toBeVisible()
    await expect(page.getByText('Dubai Marina')).toBeVisible()
    await expect(page.getByText('Home Cleaning')).toBeVisible()
  })

  test('Admin booking management workflow', async () => {
    // Login as admin
    await loginAsAdmin(page)
    
    // Navigate to service requests with booking filter
    await page.goto('/admin/service-requests?type=bookings')
    
    // Verify booking appears in list
    await expect(page.getByTestId('bookings-table')).toBeVisible()
    
    // Click on first booking
    await page.getByTestId('booking-row').first().click()
    
    // Verify booking detail page
    await expect(page.getByTestId('booking-details')).toBeVisible()
    await expect(page.getByTestId('status-badge')).toContainText('Pending Confirmation')
    
    // Confirm booking
    await page.getByTestId('confirm-booking-btn').click()
    await expect(page.getByText('Booking Confirmed')).toBeVisible()
    await expect(page.getByTestId('status-badge')).toContainText('Confirmed')
    
    // Test reschedule functionality
    await page.getByTestId('reschedule-booking-btn').click()
    
    // Select new date
    const dayAfterTomorrow = new Date()
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    const newDateSelector = `[data-date="${dayAfterTomorrow.toISOString().split('T')[0]}"]`
    await page.click(newDateSelector)
    
    await page.getByTestId('time-slot-14:00').click()
    await page.getByTestId('reschedule-reason').fill('Client requested change')
    await page.getByTestId('confirm-reschedule').click()
    
    await expect(page.getByText('Booking successfully rescheduled')).toBeVisible()
    await expect(page.getByTestId('status-badge')).toContainText('Rescheduled')
  })

  test('Booking calendar view functionality', async () => {
    await loginAsAdmin(page)
    await page.goto('/admin/service-requests?type=bookings')
    
    // Switch to calendar view
    await page.getByTestId('calendar-view-btn').click()
    await expect(page.getByTestId('booking-calendar')).toBeVisible()
    
    // Verify bookings appear on calendar
    await expect(page.getByTestId('calendar-booking-slot')).toHaveCount(3)
    
    // Click on booking slot
    await page.getByTestId('calendar-booking-slot').first().click()
    
    // Should navigate to booking detail
    await expect(page).toHaveURL(/\/admin\/service-requests\/.*/)
    await expect(page.getByTestId('booking-details')).toBeVisible()
  })

  test('Availability conflicts prevention', async () => {
    await page.goto('/')
    await page.getByTestId('quick-booking-widget').click()
    
    // Select service and conflicting time
    await page.getByTestId('service-cleaning').click()
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.click(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`)
    
    // Try to book a slot that's already taken
    await page.getByTestId('time-slot-10:00').click()
    
    // Should show as unavailable
    await expect(page.getByTestId('time-slot-10:00')).toHaveAttribute('disabled')
    await expect(page.getByText('Time slot not available')).toBeVisible()
    
    // Select available slot instead
    await page.getByTestId('time-slot-11:00').click()
    
    // Continue with booking
    await page.getByTestId('next-details').click()
    await expect(page.getByTestId('location-form')).toBeVisible()
  })

  test('Mobile booking experience', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // Mobile booking button should be visible
    await expect(page.getByTestId('mobile-booking-btn')).toBeVisible()
    await page.getByTestId('mobile-booking-btn').click()
    
    // Booking sheet should open
    await expect(page.getByTestId('booking-sheet')).toBeVisible()
    
    // Complete mobile booking flow
    await page.getByTestId('service-cleaning').click()
    
    // Mobile calendar should be scrollable
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.click(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`)
    
    // Time slots should stack vertically on mobile
    const timeSlots = page.getByTestId('time-slots-mobile')
    await expect(timeSlots).toHaveClass(/flex-col/)
    
    await page.getByTestId('time-slot-10:00').click()
    await page.getByTestId('next-details').click()
    
    // Form should be mobile-optimized
    await expect(page.getByTestId('mobile-form')).toBeVisible()
  })

  test('Email notifications integration', async () => {
    // Setup email mock
    const emailMock = await setupEmailMock()
    
    // Complete booking flow
    await completeGuestBooking(page)
    
    // Verify confirmation email was sent
    await expect(emailMock).toHaveBeenCalledWith({
      to: 'john.doe@example.com',
      subject: expect.stringContaining('Booking Confirmed'),
      template: 'booking-confirmation',
      attachments: expect.arrayContaining([
        expect.objectContaining({
          filename: expect.stringContaining('.ics'),
          contentType: 'text/calendar; method=REQUEST'
        })
      ])
    })
  })

  test('Accessibility compliance', async () => {
    await page.goto('/')
    
    // Run accessibility scan
    const results = await runAxeAccessibilityTest(page)
    expect(results.violations).toHaveLength(0)
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('quick-booking-widget')).toBeFocused()
    
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('service-selection')).toBeVisible()
    
    // Test screen reader announcements
    await page.getByTestId('service-cleaning').click()
    const announcement = await page.getByRole('status').textContent()
    expect(announcement).toContain('Service selected: Home Cleaning')
  })
})

// Helper functions
async function setupTestData() {
  // Create test services, team members, existing bookings, etc.
}

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login')
  await page.fill('[data-testid="email"]', 'admin@example.com')
  await page.fill('[data-testid="password"]', 'admin123')
  await page.click('[data-testid="login-btn"]')
  await expect(page).toHaveURL('/admin/dashboard')
}

async function completeGuestBooking(page: Page) {
  // Reusable booking completion flow
}

async function setupEmailMock() {
  // Mock email service for testing
}

async function runAxeAccessibilityTest(page: Page) {
  // Integrate with axe-playwright for accessibility testing
}
```

### 18.2 Load Testing

```typescript
// tests/load/booking-load.test.ts
import { check, sleep } from 'k6'
import http from 'k6/http'
import { Rate } from 'k6/metrics'

export let errorRate = new Rate('errors')

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 concurrent users
    { duration: '2m', target: 100 }, // Ramp up to 100
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete in 500ms
    errors: ['rate<0.1'], // Error rate must be below 10%
  }
}

const BASE_URL = 'https://your-domain.com'

export default function() {
  // Test booking creation endpoint
  const bookingPayload = {
    serviceId: 'service-1',
    title: 'Load Test Booking',
    isBooking: true,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    clientName: `Test User ${Math.random()}`,
    clientEmail: `test${Math.random()}@example.com`,
    clientPhone: '+1234567890'
  }
  
  const createResponse = http.post(
    `${BASE_URL}/api/portal/service-requests`,
    JSON.stringify(bookingPayload),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'create_booking' }
    }
  )
  
  check(createResponse, {
    'booking created successfully': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500
  }) || errorRate.add(1)
  
  // Test availability endpoint
  const availabilityResponse = http.get(
    `${BASE_URL}/api/admin/service-requests/availability?serviceId=service-1&date=2025-01-15`,
    { tags: { endpoint: 'availability' } }
  )
  
  check(availabilityResponse, {
    'availability loaded': (r) => r.status === 200,
    'availability response time < 200ms': (r) => r.timings.duration < 200
  }) || errorRate.add(1)
  
  // Test service requests list with booking filter
  const listResponse = http.get(
    `${BASE_URL}/api/admin/service-requests?isBooking=true&limit=20`,
    { tags: { endpoint: 'list_bookings' } }```sql
-- prisma/migrations/20250920_05_enhance_team_members/migration.sql
-- Add booking-specific fields to team_members table
ALTER TABLE "team_members" 
ADD COLUMN "workingHours" JSONB,
ADD COLUMN "timeZone" TEXT DEFAULT 'UTC',
ADD COLUMN "maxConcurrentBookings" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "bookingBuffer" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN "autoAssign" BOOLEAN NOT NULL DEFAULT true;

-- Add indexes for booking assignment queries
CREATE INDEX "team_members_isAvailable_status_idx" ON "team_members"("isAvailable", "status");
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");
```

```sql
-- prisma/migrations/20250920_06_create_booking_preferences/migration.sql
-- Create booking_preferences table
CREATE TABLE "booking_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "emailReminder" BOOLEAN NOT NULL DEFAULT true,
    "emailReschedule" BOOLEAN NOT NULL DEFAULT true,
    "emailCancellation" BOOLEAN NOT NULL DEFAULT true,
    "smsReminder" BOOLEAN NOT NULL DEFAULT false,
    "smsConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "reminderHours" INTEGER[] DEFAULT ARRAY[24, 2],
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_preferences_pkey" PRIMARY KEY ("id")
);

-- Add foreign key to users
ALTER TABLE "booking_preferences" ADD CONSTRAINT "booking_preferences_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint
CREATE UNIQUE INDEX "booking_preferences_userId_key" ON "booking_preferences"("userId");
```