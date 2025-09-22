import React from 'react'
import type { ServiceAnalytics } from '@/types/services'

interface Props {
  conversions?: ServiceAnalytics['conversionsByService']
  className?: string
}

export default function ConversionsTable({ conversions = [], className = '' }: Props) {
  if (!conversions || conversions.length === 0) return null
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-left">
        <thead>
          <tr>
            <th className="px-3 py-2">Service</th>
            <th className="px-3 py-2">Bookings</th>
            <th className="px-3 py-2">Views</th>
            <th className="px-3 py-2">Conversion %</th>
          </tr>
        </thead>
        <tbody>
          {conversions.map((c) => (
            <tr key={c.service} className="border-t">
              <td className="px-3 py-2">{c.service}</td>
              <td className="px-3 py-2">{c.bookings}</td>
              <td className="px-3 py-2">{c.views}</td>
              <td className="px-3 py-2">{c.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
