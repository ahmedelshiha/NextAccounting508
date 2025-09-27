/**
 * Admin Context Providers
 * 
 * Centralized provider wrapper for the admin dashboard that includes:
 * - Realtime connection for live updates
 * - Permission context for RBAC
 * - Error boundary for graceful error handling
 * - Performance monitoring for metrics
 */

'use client'

import { ReactNode } from 'react'
import { RealtimeProvider } from '@/components/dashboard/realtime/RealtimeProvider'
import { ErrorBoundary } from '@/components/providers/error-boundary'
import { usePerformanceMonitoring } from '@/hooks/admin/usePerformanceMonitoring'
import { UXMonitor } from '@/components/admin/monitoring/UXMonitor'

interface AdminProvidersProps {
  children: ReactNode
}

/**
 * Performance monitoring wrapper component that tracks admin dashboard metrics
 */
function PerformanceWrapper({ children }: { children: ReactNode }) {
  // Initialize performance monitoring for admin dashboard
  usePerformanceMonitoring('AdminDashboard')
  
  return <>{children}</>
}

/**
 * Main admin providers wrapper that orchestrates all necessary contexts
 * for the admin dashboard functionality.
 */
export default function AdminProviders({ children }: AdminProvidersProps) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Admin Dashboard Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Something went wrong while loading the admin dashboard.
                    Please refresh the page or contact support if the issue persists.
                  </p>
                  <p className="mt-1 text-xs text-red-600">{error.message}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={resetError}
                    className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      <RealtimeProvider>
        <PerformanceWrapper>
          <UXMonitor>
            {children}
          </UXMonitor>
        </PerformanceWrapper>
      </RealtimeProvider>
    </ErrorBoundary>
  )
}

/**
 * Admin Providers for Server Components
 * 
 * A lightweight version that can be used in server components
 * when full client-side providers are not needed.
 */
export function AdminProvidersServer({ children }: AdminProvidersProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}