/**
 * Timezone utilities that produce labels with UTC offset and abbreviation.
 * No external deps. Uses Intl API and a fallback list when supportedValuesOf is unavailable.
 */

export interface TimezoneOption {
  code: string
  label: string
  offset: string // e.g. UTC+05:30
  abbreviation: string // e.g. IST
}

function getAllTimezones(): string[] {
  const anyIntl = Intl as any
  if (typeof anyIntl.supportedValuesOf === 'function') {
    try { return (anyIntl.supportedValuesOf('timeZone') as string[]).sort() } catch {}
  }
  // fallback common zones
  return [
    'UTC','Etc/UTC','Europe/London','Europe/Berlin','Europe/Paris','Europe/Madrid','Europe/Rome','Europe/Warsaw','Europe/Kiev','Europe/Moscow',
    'America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Sao_Paulo',
    'Asia/Dubai','Asia/Kolkata','Asia/Karachi','Asia/Dhaka','Asia/Jakarta','Asia/Bangkok','Asia/Shanghai','Asia/Tokyo','Asia/Seoul','Asia/Singapore',
    'Australia/Sydney','Australia/Melbourne','Pacific/Auckland'
  ]
}

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}` }

/**
 * Get timezone offset in minutes using a more reliable approach.
 * Uses Date.getTimezoneOffset concept but applies it to a specific timezone.
 */
function getOffsetMinutes(tz: string, date = new Date()): number {
  try {
    // Format the date in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const parts = formatter.formatToParts(date)
    const values: Record<string, number> = {}

    for (const part of parts) {
      if (part.type !== 'literal') {
        values[part.type] = parseInt(part.value, 10)
      }
    }

    // Extract timezone-adjusted components
    const tzYear = values.year
    const tzMonth = values.month - 1 // JS months are 0-indexed
    const tzDay = values.day
    const tzHours = values.hour
    const tzMinutes = values.minute
    const tzSeconds = values.second

    // Create a date object from the timezone-adjusted components (treating them as UTC)
    const tzDate = new Date(Date.UTC(tzYear, tzMonth, tzDay, tzHours, tzMinutes, tzSeconds))

    // Create a date object from the original UTC components
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()))

    // The offset is the difference between the two dates
    const diffMs = tzDate.getTime() - utcDate.getTime()
    const diffMinutes = Math.round(diffMs / 60000)

    return Number.isFinite(diffMinutes) ? diffMinutes : 0
  } catch {
    return 0
  }
}

function formatOffset(mins: number): string {
  if (!isFinite(mins) || mins === 0) return 'UTC'

  // Ensure mins is an integer
  const intMins = Math.round(mins)
  const sign = intMins >= 0 ? '+' : '-'
  const abs = Math.abs(intMins)
  const h = Math.floor(abs / 60)
  const m = abs % 60

  // Format with zero-padding
  const formattedHours = pad(h)
  const formattedMinutes = pad(m)

  if (m === 0) {
    return `UTC${sign}${formattedHours}`
  }

  return `UTC${sign}${formattedHours}:${formattedMinutes}`
}

function getAbbreviation(tz: string, date = new Date()): string {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    const parts = f.formatToParts(date)
    
    // Find the timeZoneName part
    const timeZoneNamePart = parts.find(p => p.type === 'timeZoneName')
    if (timeZoneNamePart) {
      const abbr = timeZoneNamePart.value
      // Clean up any unwanted characters (numbers, colons, plus/minus signs)
      return abbr.replace(/[0-9:+-]/g, '').trim() || 'UTC'
    }
    
    return 'UTC'
  } catch { 
    return 'UTC' 
  }
}

export function getTimezonesWithOffsets(now = new Date()): TimezoneOption[] {
  const zones = getAllTimezones()
  const items: TimezoneOption[] = []
  const processed = new Set<string>()

  for (const tz of zones) {
    // Skip duplicates and invalid timezones
    if (processed.has(tz)) continue
    
    try {
      const mins = getOffsetMinutes(tz, now)
      const offset = formatOffset(mins)
      const abbr = getAbbreviation(tz, now)
      
      // Format: "Pacific/Marquesas (GMT-9:30)"
      const label = `${tz} (${offset})`
      
      items.push({ 
        code: tz, 
        label, 
        offset, 
        abbreviation: abbr 
      })
      
      processed.add(tz)
    } catch {
      // Skip invalid timezones
    }
  }

  // Sort by offset first, then by timezone code
  items.sort((a, b) => {
    const parseOffset = (s: string): number => {
      if (s === 'UTC') return 0
      const match = s.match(/UTC([+-])(\d{1,2}):?(\d{2})?/)
      if (!match) return 0
      const sign = match[1] === '+' ? 1 : -1
      const hours = parseInt(match[2], 10)
      const minutes = match[3] ? parseInt(match[3], 10) : 0
      return sign * (hours * 60 + minutes)
    }
    
    const offsetA = parseOffset(a.offset)
    const offsetB = parseOffset(b.offset)
    
    if (offsetA !== offsetB) {
      return offsetA - offsetB
    }
    
    return a.code.localeCompare(b.code)
  })

  return items
}

/**
 * Get the user's default timezone based on their browser/system timezone
 * Falls back to UTC if unavailable
 */
export function getDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}
