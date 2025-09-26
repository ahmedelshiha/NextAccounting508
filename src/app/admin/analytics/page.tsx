/**
 * Admin Analytics Dashboard Page
 * Comprehensive performance monitoring and system analytics
 * 
 * @author NextAccounting Admin Analytics
 * @version 1.0.0
 */

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard'

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Admin',
  description: 'Performance monitoring and system analytics for admin dashboard',
}

export default async function AdminAnalyticsPage() {
  // Require authenticated session
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }

  // Role-based access control
  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') {
    redirect('/portal')
  }

  // Admin and team leads can access analytics
  if (!['ADMIN', 'TEAM_LEAD'].includes(role || '')) {
    redirect('/admin')
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor admin dashboard performance, user behavior, and system health
          </p>
        </div>
        
        <AnalyticsDashboard />
      </div>
    </div>
  )
}