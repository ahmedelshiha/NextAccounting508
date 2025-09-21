"use client"

import { addDays, endOfMonth, format, isBefore, isEqual, isSameMonth, startOfMonth } from 'date-fns'
import { useMemo, useState } from 'react'

export type TouchCalendarProps = {
  value?: string // yyyy-MM-dd
  min?: string // yyyy-MM-dd
  onChange?: (date: string) => void
}

function toDateOnlyString(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export default function TouchCalendar({ value, min, onChange }: TouchCalendarProps) {
  const today = useMemo(() => new Date(), [])
  const minDate = useMemo(() => (min ? new Date(min) : today), [min, today])
  const initial = useMemo(() => (value ? new Date(value) : today), [value, today])
  const [cursor, setCursor] = useState<Date>(new Date(initial.getFullYear(), initial.getMonth(), 1))

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor])
  const monthEnd = useMemo(() => endOfMonth(cursor), [cursor])

  const days = useMemo(() => {
    const result: { date: Date; disabled: boolean }[] = []
    const start = monthStart
    const end = monthEnd
    let d = start
    // Start from the first day of the week (Mon=1..Sun=0 per toLocale?) we'll keep simple grid and not pad before
    while (!isAfterDay(d, end)) {
      const disabled = isBefore(stripTime(d), stripTime(minDate))
      result.push({ date: d, disabled })
      d = addDays(d, 1)
    }
    return result
  }, [monthStart, monthEnd, minDate])

  const selected = value ? new Date(value) : null

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setCursor(addMonthsSafe(cursor, -1))} className="px-3 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.99]">Prev</button>
        <div className="text-sm font-medium text-gray-900">{format(monthStart, 'MMMM yyyy')}</div>
        <button type="button" onClick={() => setCursor(addMonthsSafe(cursor, 1))} className="px-3 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.99]">Next</button>
      </div>
      <div className="grid grid-cols-7 gap-1 select-none">
        {['S','M','T','W','T','F','S'].map((d) => (
          <div key={d} className="text-center text-[11px] text-gray-500 py-1">{d}</div>
        ))}
        {padLeadingEmpty(monthStart).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map(({ date, disabled }) => {
          const isSelected = !!selected && isEqual(stripTime(date), stripTime(selected))
          const isCurrentMonth = isSameMonth(date, monthStart)
          const base = "w-full aspect-square rounded-lg flex items-center justify-center text-sm"
          const state = disabled
            ? 'bg-gray-100 text-gray-400'
            : isSelected
              ? 'bg-blue-600 text-white'
              : isCurrentMonth
                ? 'bg-white text-gray-900 border border-gray-200 hover:border-blue-500'
                : 'bg-gray-50 text-gray-500'
          return (
            <button
              type="button"
              key={toDateOnlyString(date)}
              disabled={disabled}
              onClick={() => onChange?.(toDateOnlyString(date))}
              className={`${base} ${state}`}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function addMonthsSafe(d: Date, delta: number) {
  const nd = new Date(d)
  nd.setMonth(d.getMonth() + delta)
  return nd
}

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isAfterDay(a: Date, b: Date) {
  const sa = stripTime(a)
  const sb = stripTime(b)
  return sa.getTime() > sb.getTime()
}

function padLeadingEmpty(monthStart: Date) {
  // 0=Sunday..6=Saturday, want to start week on Sunday
  const day = monthStart.getDay()
  return Array.from({ length: day })
}
