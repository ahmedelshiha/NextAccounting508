import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default function TaskAnalytics() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-gray-600">Analytics (placeholder)</div>
        <div className="mt-2 text-lg font-semibold">Status & Priority overview</div>
        <div className="mt-3 text-sm text-gray-500">Connect a database to see real analytics.</div>
      </CardContent>
    </Card>
  )
}
