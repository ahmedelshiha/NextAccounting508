import prisma from '@/lib/prisma'

export type ISO = string

export type AvailabilitySlot = { start: ISO; end: ISO; available: boolean }

export type BusyInterval = { start: Date; end: Date }

export type BusinessHours = {
  // 0 = Sunday ... 6 = Saturday
  [weekday: number]: { startMinutes: number; endMinutes: number } | undefined
}

export type AvailabilityOptions = {
  // Minutes to block before and after each booking
  bookingBufferMinutes?: number
  // Skip weekends entirely (if business hours omitted for weekends)
  skipWeekends?: boolean
  // Maximum number of bookings allowed per day (0 or undefined = unlimited)
  maxDailyBookings?: number
  // Business hours per weekday; if undefined for a day, that day is closed
  businessHours?: BusinessHours
  // Reference time used to filter out past slots (defaults to now)
  now?: Date
}

export function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd
}

function dayStart(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function clampToBusinessHours(d: Date, bh?: { startMinutes: number; endMinutes: number }) {
  if (!bh) return null
  const s = new Date(d)
  s.setHours(0, 0, 0, 0)
  const dayStartMs = s.getTime()
  const start = new Date(dayStartMs + bh.startMinutes * 60_000)
  const end = new Date(dayStartMs + bh.endMinutes * 60_000)
  if (end <= start) return null
  return { start, end }
}

export function generateAvailability(
  from: Date,
  to: Date,
  slotMinutes: number,
  busy: BusyInterval[],
  opts: AvailabilityOptions = {}
): AvailabilitySlot[] {
  const options: { bookingBufferMinutes: number; skipWeekends: boolean; maxDailyBookings: number; businessHours: BusinessHours; now: Date } = {
    bookingBufferMinutes: opts.bookingBufferMinutes ?? 0,
    skipWeekends: opts.skipWeekends ?? true,
    maxDailyBookings: opts.maxDailyBookings ?? 0,
    businessHours: opts.businessHours ?? {
      1: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
      2: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
      3: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
      4: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
      5: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
    },
    now: opts.now ?? new Date(),
  }

  const result: AvailabilitySlot[] = []
  const start = new Date(from)
  const end = new Date(to)
  const now = options.now

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const wd = d.getDay() // 0..6
    const bh = options.businessHours[wd]
    if (!bh) continue
    if (options.skipWeekends && (wd === 0 || wd === 6)) continue

    const windowRange = clampToBusinessHours(d, bh)
    if (!windowRange) continue

    // enforce max daily bookings by counting existing busy intervals fully in this day
    const dayBusy = busy.filter((b) => {
      const s = dayStart(d)
      const e = addMinutes(s, 24 * 60)
      return rangesOverlap(b.start, b.end, s, e)
    })
    if (options.maxDailyBookings > 0) {
      const countExisting = dayBusy.length
      if (countExisting >= options.maxDailyBookings) continue
    }

    const slotStart = new Date(windowRange.start)
    while (true) {
      const slotEnd = addMinutes(slotStart, slotMinutes)
      if (slotEnd > windowRange.end) break

      // Skip past slots using provided reference time
      if (slotStart < now) {
        slotStart.setMinutes(slotStart.getMinutes() + slotMinutes)
        continue
      }

      // apply buffer around busy intervals
      const bufferedBusy = options.bookingBufferMinutes > 0
        ? dayBusy.map((b) => ({
            start: addMinutes(b.start, -options.bookingBufferMinutes),
            end: addMinutes(b.end, options.bookingBufferMinutes),
          }))
        : dayBusy

      const conflicts = bufferedBusy.some((b) => rangesOverlap(slotStart, slotEnd, b.start, b.end))

      result.push({ start: slotStart.toISOString(), end: slotEnd.toISOString(), available: !conflicts })

      slotStart.setMinutes(slotStart.getMinutes() + slotMinutes)
    }
  }

  return result
}

export async function getAvailabilityForService(params: {
  serviceId: string
  from: Date
  to: Date
  slotMinutes?: number
  teamMemberId?: string
  options?: AvailabilityOptions
}) {
  const { serviceId, from, to, slotMinutes, teamMemberId, options } = params

  const svc = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!svc || svc.active === false) {
    return { slots: [] as AvailabilitySlot[] }
  }
  const baseDuration = svc.duration ?? 60
  const minutes = slotMinutes ?? baseDuration

  // If a team member is requested, prefer their working hours, buffer and capacity
  let member: { id: string; workingHours?: any; bookingBuffer?: number; maxConcurrentBookings?: number; isAvailable?: boolean; timeZone?: string } | null = null
  if (teamMemberId) {
    try {
      member = await prisma.teamMember.findUnique({ where: { id: teamMemberId }, select: { id: true, workingHours: true, bookingBuffer: true, maxConcurrentBookings: true, isAvailable: true, timeZone: true } })
    } catch {
      member = null
    }
  }

  // If the member exists but is not available, return empty
  if (member && member.isAvailable === false) {
    return { slots: [] as AvailabilitySlot[] }
  }

  // Determine booking buffer and daily cap: prefer member settings, fallback to service
  const bookingBufferMinutes = typeof (member?.bookingBuffer) === 'number' ? (member!.bookingBuffer || 0) : (typeof svc.bufferTime === 'number' ? svc.bufferTime : 0)
  const maxDailyBookings = typeof (member?.maxConcurrentBookings) === 'number' && (member!.maxConcurrentBookings > 0) ? member!.maxConcurrentBookings : (typeof svc.maxDailyBookings === 'number' ? svc.maxDailyBookings : 0)

  // Determine business hours: prefer member.workingHours if present
  let businessHours = undefined
  try {
    if (member && member.workingHours) {
      businessHours = normalizeBusinessHours(member.workingHours as any)
    }
  } catch {
    businessHours = undefined
  }
  if (!businessHours) {
    businessHours = normalizeBusinessHours(svc.businessHours as any)
  }

  // Fetch busy bookings for the given window. If a team member is specified, filter to that member.
  const busyBookings = await prisma.booking.findMany({
    where: {
      serviceId,
      scheduledAt: { gte: from, lte: to },
      status: { in: ['PENDING', 'CONFIRMED'] as any },
      ...(teamMemberId ? { assignedTeamMemberId: teamMemberId } : {}),
    },
    select: { scheduledAt: true, duration: true },
  })

  const busy: BusyInterval[] = busyBookings.map((b) => {
    const start = new Date(b.scheduledAt)
    const end = addMinutes(start, (b.duration ?? baseDuration))
    return { start, end }
  })

  // Include admin-managed AvailabilitySlot entries as busy windows when they block availability
  try {
    const slotWhere: any = { serviceId, date: { gte: from, lte: to } }
    if (teamMemberId) slotWhere.teamMemberId = teamMemberId
    const availSlots = await prisma.availabilitySlot.findMany({ where: slotWhere })
    for (const s of availSlots) {
      try {
        // If the slot is explicitly unavailable, block the interval
        if (s.available === false) {
          const date = new Date(s.date)
          const [sh, sm] = (s.startTime || '00:00').split(':').map((n) => parseInt(n || '0', 10))
          const [eh, em] = (s.endTime || '00:00').split(':').map((n) => parseInt(n || '0', 10))
          const start = new Date(date)
          start.setHours(sh, sm, 0, 0)
          const end = new Date(date)
          end.setHours(eh, em, 0, 0)
          busy.push({ start, end })
        } else if (typeof s.maxBookings === 'number' && s.maxBookings > 0 && typeof s.currentBookings === 'number' && s.currentBookings >= s.maxBookings) {
          // If slot is full according to maxBookings/currentBookings, treat as busy
          const date = new Date(s.date)
          const [sh, sm] = (s.startTime || '00:00').split(':').map((n) => parseInt(n || '0', 10))
          const [eh, em] = (s.endTime || '00:00').split(':').map((n) => parseInt(n || '0', 10))
          const start = new Date(date)
          start.setHours(sh, sm, 0, 0)
          const end = new Date(date)
          end.setHours(eh, em, 0, 0)
          busy.push({ start, end })
        }
      } catch {}
    }
  } catch (e) {
    // ignore availability slot errors and continue with bookings
  }

  const slots = generateAvailability(from, to, minutes, busy, {
    ...options,
    bookingBufferMinutes,
    maxDailyBookings,
    businessHours,
    skipWeekends: options?.skipWeekends ?? false,
    now: options?.now,
  })

  return { slots }
}
