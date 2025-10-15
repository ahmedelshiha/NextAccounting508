"use client"

import React from 'react'

export function LoadingSkeleton({ type = 'default' }: { type?: 'default' | 'dashboard' | 'table' | 'card' }) {
  if (type === 'dashboard') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded" />
        ))}
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-8 bg-gray-300 rounded w-3/4" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
}
