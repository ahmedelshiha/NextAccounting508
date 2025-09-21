import prisma from '@/lib/prisma'

export type ISO = string

export type AvailabilitySlot = { start: ISO; end: ISO; available: boolean }

export type BusyInterval = { start: Date; end: Date }

export type BusinessHours = {
  // 0 = Sunday ... 6 = Saturday
  [weekday: number]: { startMinutes: number; endMinutes: number } | undefined
}

export function toMinutes(str: string): number | null {
  const parts = str.split(':')
  if (parts.length !== 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function normalizeBusinessHours(raw: unknown): BusinessHours | undefined {
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
      if (typeof (val as any).startMinutes === 'number' && typeof (val as any).endMinutes === 'number') {
        out[idx] = { startMinutes: (val as any).startMinutes, endMinutes: (val as any).endMinutes }
        continue
      }
      if (typeof (val as any).start === 'number' && typeof (val as any).end === 'number') {
        out[idx] = { startMinutes: (val as any).start, endMinutes: (val as any).end }
        continue
      }
      if (typeof (val as any).startTime === 'string' && typeof (val as any).endTime === 'string') {
        const s = toMinutes((val as any).startTime)
        const e = toMinutes((val as any).endTime)
        if (s != null && e != null) out[idx] = { startMinutes: s, endMinutes: e }
        continue
      }
    }
  }
  return Object.keys(out).length ? out : undefined
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

  const slots = generateAvailability(from, to, minutes, busy, options)
  return { slots }
}
