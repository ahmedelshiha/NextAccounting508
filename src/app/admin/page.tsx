'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Metadata } from 'next'
import AdminErrorBoundary from '@/components/admin/layout/AdminErrorBoundary'
import { LoadingSkeleton } from '@/components/admin/loading-skeleton'

export const metadata: Metadata = {
  title: 'Admin Dashboard Overview',
  description: 'Professional admin overview with live KPIs and analytics',
}

const AdminOverviewClient = dynamic(() => import('@/components/admin/dashboard/AdminOverview'), {
  ssr: false,
  loading: () => <LoadingSkeleton type="dashboard" />,
})

export default function AdminOverviewPage() {
  return (
    <AdminErrorBoundary>
      <Suspense fallback={<LoadingSkeleton type="dashboard" />}>
        <AdminOverviewClient />
      </Suspense>
    </AdminErrorBoundary>
  )
}
