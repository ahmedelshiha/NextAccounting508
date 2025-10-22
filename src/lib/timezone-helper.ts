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

function getOffsetMinutes(tz: string, date = new Date()): number {
  const utc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  )
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })
  const parts = f.formatToParts(date)
  const map: Record<string,string> = {}
  for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value
  const zoned = Date.UTC(Number(map.year), Number(map.month)-1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second))
  return (zoned - utc) / 60000
}

function formatOffset(mins: number): string {
  if (!isFinite(mins)) return 'UTC'
  const sign = mins >= 0 ? '+' : '-'
  const abs = Math.abs(mins)
  const h = Math.floor(abs / 60)
  const m = Math.round(abs % 60) // Round to nearest minute to avoid floating-point precision errors
  if (abs === 0) return 'UTC'
  return `UTC${sign}${pad(h)}:${pad(m)}`
}

function getAbbreviation(tz: string, date = new Date()): string {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    const s = f.format(date)
    const abbr = s.split(' ').pop() || ''
    return abbr.replace(/[0-9:+-]/g, '').trim() || 'UTC'
  } catch { return 'UTC' }
}

export function getTimezonesWithOffsets(now = new Date()): TimezoneOption[] {
  const zones = getAllTimezones()
  const items: TimezoneOption[] = []
  for (const tz of zones) {
    try {
      const mins = getOffsetMinutes(tz, now)
      const offset = formatOffset(mins)
      const abbr = getAbbreviation(tz, now)
      const label = `[${offset}] ${tz} (${abbr})`
      items.push({ code: tz, label, offset, abbreviation: abbr })
    } catch {}
  }
  // Sort by absolute offset, then by code
  items.sort((a,b)=>{
    if (a.offset === b.offset) return a.code.localeCompare(b.code)
    const parse = (s:string)=>{ if (s==='UTC') return 0; const m = s.match(/UTC([+-])(\d{2}):(\d{2})/); if (!m) return 0; const sign = m[1]==='+'?1:-1; return sign*(Number(m[2])*60+Number(m[3])) }
    return parse(a.offset) - parse(b.offset)
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
