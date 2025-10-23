"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CalendarDays, Bell } from 'lucide-react'

export type Deadline = { id: string; date: Date; label: string; description: string }

function buildDeadlines(year: number): Deadline[] {
  const d = (m: number, day: number) => new Date(year, m - 1, day)
  return [
    { id: `1099-${year}`, date: d(1, 31), label: '1099/1096 Filing', description: 'Issue Forms 1099 and file Form 1096 with IRS.' },
    { id: `scorp-${year}`, date: d(3, 15), label: 'S‑Corp/Partnership Returns', description: 'File Forms 1120‑S and 1065, or file extension.' },
    { id: `indiv-${year}`, date: d(4, 15), label: 'Individual Tax Return', description: 'File Form 1040 or submit extension and pay due tax.' },
    { id: `q2-${year}`, date: d(6, 15), label: 'Q2 Estimated Tax', description: 'Second quarter estimated tax payment due.' },
    { id: `s‑ext-${year}`, date: d(9, 15), label: 'S‑Corp/Partnership Extension', description: 'Extended deadline for 1120‑S and 1065 returns.' },
    { id: `q3-${year}`, date: d(9, 15), label: 'Q3 Estimated Tax', description: 'Third quarter estimated tax payment due.' },
    { id: `indiv‑ext-${year}`, date: d(10, 15), label: 'Individual Extension', description: 'Extended deadline for individual returns (1040).'},
  ]
}

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' })
}

export function DeadlineTracker() {
  const today = new Date()
  const year = today.getFullYear()
  const all = useMemo(() => {
    const current = buildDeadlines(year)
    const nextYear = buildDeadlines(year + 1)
    return [...current, ...nextYear].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [year])

  const upcoming = useMemo(() => all.filter(dl => dl.date.getTime() >= today.setHours(0,0,0,0)).slice(0, 5), [all, today])

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Upcoming Tax Deadlines</CardTitle>
          <CardDescription className="text-xs">Key federal dates to keep on your radar</CardDescription>
        </div>
        <CalendarDays className="h-5 w-5 text-blue-600" />
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {upcoming.map((dl) => (
            <li key={dl.id} className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{dl.label}</div>
                  <div className="text-xs text-gray-600">{dl.description}</div>
                </div>
                <div className="text-sm font-semibold text-blue-700 whitespace-nowrap">{formatDate(dl.date)}</div>
              </div>
            </li>
          ))}
          {upcoming.length === 0 && (
            <li className="p-4 text-sm text-gray-500">No upcoming deadlines in the next months.</li>
          )}
        </ul>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button asChild>
            <Link href="/admin/profile?tab=booking">
              <Bell className="h-4 w-4 mr-2" /> Enable Email Reminders
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/resources/tax-calendar">View Full Calendar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
