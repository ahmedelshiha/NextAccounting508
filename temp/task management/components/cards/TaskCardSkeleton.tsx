import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const TaskCardSkeleton: React.FC = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="h-5 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="h-4 w-4 bg-gray-200 rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-3 w-full bg-gray-200 rounded mb-3" />
        <div className="h-3 w-3/4 bg-gray-200 rounded mb-4" />
        <div className="h-2 w-full bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex justify-between pt-3 border-t">
          <div className="h-8 w-20 bg-gray-200 rounded" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}
