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
import AdminAnalyticsPageClient from '@/components/admin/analytics/AdminAnalyticsPageClient'

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Admin',
  description: 'Performance monitoring and system analytics for admin dashboard',
}

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }

  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') {
    redirect('/portal')
  }

  if (!['ADMIN', 'TEAM_LEAD'].includes(role || '')) {
    redirect('/admin')
  }

  return <AdminAnalyticsPageClient />
}
