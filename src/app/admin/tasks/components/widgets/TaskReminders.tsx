import React from 'react'

interface Reminder { id: string; reminderDate?: string; reminderAt?: string; type?: string; sent?: boolean }

export default function TaskReminders({ reminders }: { reminders: Reminder[] }) {
  if (!Array.isArray(reminders) || reminders.length === 0) {
    return <div className="text-sm text-gray-500">No reminders</div>
  }
  return (
    <ul className="space-y-1">
      {reminders.map((r) => {
        const when = r.reminderDate || r.reminderAt || ''
        const label = when ? new Date(when).toLocaleString() : '—'
        return (
          <li key={r.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{r.type || 'reminder'}</span>
            <span className="text-gray-500">{label}</span>
            <span className={`text-xs ${r.sent ? 'text-green-600' : 'text-yellow-600'}`}>{r.sent ? 'sent' : 'scheduled'}</span>
          </li>
        )
      })}
    </ul>
  )
}
