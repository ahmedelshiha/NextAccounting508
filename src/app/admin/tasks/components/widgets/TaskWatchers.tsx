import React from 'react'

export default function TaskWatchers({ watchers }: { watchers: string[] }) {
  if (!Array.isArray(watchers) || watchers.length === 0) {
    return (
      <div className="text-sm text-gray-500">No watchers</div>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      {watchers.map((w, i) => (
        <span key={`${w}-${i}`} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 border">
          {w}
        </span>
      ))}
    </div>
  )
}
