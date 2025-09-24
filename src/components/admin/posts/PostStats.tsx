"use client"

import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Edit, Star, TrendingUp, Users } from 'lucide-react'

interface PostStatsProps {
  published: number
  drafts: number
  featured: number
  needsReview: number
  totalViews: number
}

export default function PostStats({ published, drafts, featured, needsReview, totalViews }: PostStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Published</p>
              <p className="text-2xl font-bold text-blue-900">{published}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Drafts</p>
              <p className="text-2xl font-bold text-yellow-900">{drafts}</p>
            </div>
            <Edit className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Featured</p>
              <p className="text-2xl font-bold text-purple-900">{featured}</p>
            </div>
            <Star className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Views</p>
              <p className="text-2xl font-bold text-green-900">{(totalViews || 0).toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Need Review</p>
              <p className="text-2xl font-bold text-red-900">{needsReview}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
