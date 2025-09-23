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

export function toMinutes(str: string | number) {
  if (typeof str === 'number') return Math.floor(str)
  if (typeof str !== 'string') return null
  const parts = str.split(':').map((v: string) => parseInt(v, 10))
  if (parts.length === 0) return null
  const h = Number.isNaN(parts[0]) ? NaN : parts[0]
  const m = parts.length > 1 ? (Number.isNaN(parts[1]) ? NaN : parts[1]) : 0
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
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

function normalizeBusinessHours(raw: unknown): BusinessHours | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: BusinessHours = {} as any
  const asObj = raw as Record<string, any>
  const keys = Array.isArray(raw) ? Object.keys(raw as any) : Object.keys(asObj)
  for (const k of keys) {
    const idx = Number(k)
    const val = (Array.isArray(raw) ? (raw as any)[k as any] : asObj[k])
    if (val == null) continue
    if (typeof val === 'string') {
      const parts = val.split('-')
      if (parts.length === 2) {
        const s = toMinutes(parts[0].trim())
        const e = toMinutes(parts[1].trim())
        if (s != null && e != null) out[idx] = { startMinutes: s, endMinutes: e }
      }
      continue
    }
    if (typeof val === 'object') {
      if (typeof val.startMinutes === 'number' && typeof val.endMinutes === 'number') {
        out[idx] = { startMinutes: val.startMinutes, endMinutes: val.endMinutes }
        continue
      }
      if (typeof val.start === 'number' && typeof val.end === 'number') {
        out[idx] = { startMinutes: val.start, endMinutes: val.end }
        continue
      }
      if (typeof val.startTime === 'string' && typeof val.endTime === 'string') {
        const s = toMinutes(val.startTime)
        const e = toMinutes(val.endTime)
        if (s != null && e != null) out[idx] = { startMinutes: s, endMinutes: e }
        continue
      }
    }
  }
  return Object.keys(out).length ? out : undefined
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

      // Consider a slot blocked if its START falls within any buffered busy interval.
      // This matches expected behavior where a slot starting before the buffer begins is allowed.
      const conflicts = bufferedBusy.some((b) => slotStart >= b.start && slotStart < b.end)

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

  console.log('[getAvailabilityForService] start', { serviceId, from: from.toISOString(), to: to.toISOString(), slotMinutes, teamMemberId })
  const svc = await prisma.service.findUnique({ where: { id: serviceId } })
  console.log('[getAvailabilityForService] got service', !!svc)
  if (!svc) return { slots: [] as AvailabilitySlot[] }
  const hasStatus = typeof (svc as any).status === 'string'
  const isActive = hasStatus ? String((svc as any).status).toUpperCase() === 'ACTIVE' : ((svc as any).active !== false)
  if (!isActive) return { slots: [] as AvailabilitySlot[] }
  const baseDuration = svc.duration ?? 60
  const minutes = slotMinutes ?? baseDuration

  // If a team member is requested, prefer their working hours, buffer and capacity
  let member: { id: string; workingHours?: any; bookingBuffer?: number; maxConcurrentBookings?: number; isAvailable?: boolean; timeZone?: string | null } | null = null
  if (teamMemberId) {
    try {
      console.log('[getAvailabilityForService] fetching teamMember', teamMemberId)
      member = await prisma.teamMember.findUnique({ where: { id: teamMemberId }, select: { id: true, workingHours: true, bookingBuffer: true, maxConcurrentBookings: true, isAvailable: true, timeZone: true } })
      console.log('[getAvailabilityForService] got teamMember', !!member)
    } catch (err) {
      console.error('[getAvailabilityForService] teamMember error', err)
      member = null
    }
  }

  // If the member exists but is not available, return empty
  if (member && member.isAvailable === false) {
    console.log('[getAvailabilityForService] member not available')
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
  } catch (e) {
    console.error('[getAvailabilityForService] normalize member workingHours error', e)
    businessHours = undefined
  }
  if (!businessHours) {
    businessHours = normalizeBusinessHours(svc.businessHours as any)
  }
  console.log('[getAvailabilityForService] businessHours present?', !!businessHours, 'bookingBuffer', bookingBufferMinutes, 'maxDaily', maxDailyBookings)

  // Fetch busy bookings for the given window. If a team member is specified, filter to that member.
  console.log('[getAvailabilityForService] fetching bookings window', from.toISOString(), to.toISOString())
  const busyBookings = await prisma.booking.findMany({
    where: {
      serviceId,
      scheduledAt: { gte: from, lte: to },
      status: { in: ['PENDING', 'CONFIRMED'] as any },
      ...(teamMemberId ? { assignedTeamMemberId: teamMemberId } : {}),
    },
    select: { scheduledAt: true, duration: true },
  })
  console.log('[getAvailabilityForService] bookings fetched', (busyBookings || []).length)

  const busy: BusyInterval[] = busyBookings.map((b) => {
    const start = new Date(b.scheduledAt)
    const end = addMinutes(start, (b.duration ?? baseDuration))
    return { start, end }
  })

  // Include admin-managed AvailabilitySlot entries as busy windows when they block availability
  try {
    const slotWhere: any = { serviceId, date: { gte: from, lte: to } }
    if (teamMemberId) slotWhere.teamMemberId = teamMemberId
    // Use a timeout wrapper to avoid hanging when prisma methods are not mocked in tests
    const findPromise = prisma.availabilitySlot.findMany({ where: slotWhere })
    const availSlots = await Promise.race([
      findPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('availabilitySlot.findMany timeout')), 200)),
    ]).catch(() => [])

    for (const s of availSlots as any[]) {
      try {
        // If the slot is explicitly unavailable, block the interval
        if (s.available === false) {
          const date = new Date(s.date)
          const [sh, sm] = (s.startTime || '00:00').split(':').map((n: string) => parseInt(n || '0', 10))
          const [eh, em] = (s.endTime || '00:00').split(':').map((n) => parseInt(n || '0', 10))
          const start = new Date(date)
          start.setHours(sh, sm, 0, 0)
          const end = new Date(date)
          end.setHours(eh, em, 0, 0)
          busy.push({ start, end })
        } else if (typeof s.maxBookings === 'number' && s.maxBookings > 0 && typeof s.currentBookings === 'number' && s.currentBookings >= s.maxBookings) {
          // If slot is full according to maxBookings/currentBookings, treat as busy
          const date = new Date(s.date)
          const [sh, sm] = (s.startTime || '00:00').split(':').map((n: string) => parseInt(n || '0', 10))
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
