'use client'

import React from 'react'

export default function RecentChanges() {
  // In production this would fetch recent audit events; keep static for now
  const items = [
    { id: 1, text: 'Auth secret rotated', when: '2 days ago', user: 'system' },
    { id: 2, text: 'Currency rates refreshed', when: '5 days ago', user: 'scheduler' },
    { id: 3, text: 'Webhook updated', when: '9 days ago', user: 'admin@accountingfirm.com' },
  ]

  return (
    <div>
      <ul className="mt-4 space-y-2 text-sm text-gray-700" aria-live="polite">
        {items.map((it) => (
          <li key={it.id} className="flex justify-between">
            <span>{it.text}</span>
            <span className="text-muted-foreground">{it.when}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
