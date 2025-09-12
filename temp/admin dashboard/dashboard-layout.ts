// components/dashboard/DashboardLayout.tsx
import React, { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'
import { DashboardHeader } from './header/DashboardHeader'
import { KPIGrid } from './kpi/KPIGrid'
import { QuickActions } from './actions/QuickActions'
import { ActivityFeed } from './activity/ActivityFeed'
import { SystemHealth } from './health/SystemHealth'
import { BusinessIntelligence } from './analytics/BusinessIntelligence'

// Lazy load heavy components
const LazyBusinessIntelligence = React.lazy(() => import('./analytics/BusinessIntelligence'))

export const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <ErrorBoundary fallback={<div className="text-red-500">Header failed to load</div>}>
          <DashboardHeader />
        </ErrorBoundary>
        
        <ErrorBoundary fallback={<div className="text-red-500">KPIs failed to load</div>}>
          <Suspense fallback={<DashboardSkeleton.KPIGrid />}>
            <KPIGrid />
          </Suspense>
        </ErrorBoundary>
        
        <ErrorBoundary fallback={<div className="text-red-500">Quick actions failed to load</div>}>
          <QuickActions />
        </ErrorBoundary>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ErrorBoundary fallback={<div className="text-red-500">Activity feed failed to load</div>}>
              <Suspense fallback={<DashboardSkeleton.ActivityFeed />}>
                <ActivityFeed />
              </Suspense>
            </ErrorBoundary>
          </div>
          
          <div>
            <ErrorBoundary fallback={<div className="text-red-500">System health failed to load</div>}>
              <Suspense fallback={<DashboardSkeleton.SystemHealth />}>
                <SystemHealth />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
        
        <ErrorBoundary fallback={<div className="text-red-500">Business intelligence failed to load</div>}>
          <Suspense fallback={<DashboardSkeleton.BusinessIntelligence />}>
            <LazyBusinessIntelligence />
          </Suspense>
        </ErrorBoundary>
        
        {/* Footer */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Dashboard v2.0</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout