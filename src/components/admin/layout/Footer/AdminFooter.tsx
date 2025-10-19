'use client'

/**
 * AdminFooter Component
 * 
 * Root footer component for the admin dashboard with responsive layouts
 * (desktop/tablet/mobile). Integrates all footer sub-components and
 * system health monitoring.
 * 
 * @module @/components/admin/layout/Footer/AdminFooter
 */

import { useResponsive } from '@/hooks/admin/useResponsive'
import { useSystemHealth } from '@/hooks/admin/useSystemHealth'
import SystemStatus from './SystemStatus'
import ProductInfo from './ProductInfo'
import SupportLinks from './SupportLinks'
import EnvironmentBadge from './EnvironmentBadge'
import { FOOTER_BRANDING } from './constants'
import type { AdminFooterProps, FooterLink } from './types'

/**
 * Simple compact footer layout used for Admin Settings pages
 */
function SimpleFooter({
  health,
  isLoading,
  error,
  hideHealth,
  hideEnvironment,
  customLinks,
}: {
  health: any
  isLoading: boolean
  error: Error | null
  hideHealth?: boolean
  hideEnvironment?: boolean
  customLinks?: FooterLink[]
}) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4 min-w-[200px]">
        <ProductInfo compact />
      </div>
      <div className="flex-1 flex items-center justify-center min-w-[200px]" />
      <div className="flex items-center gap-3 min-w-[200px] justify-end">
        {!hideHealth && (
          <SystemStatus
            health={health}
            loading={isLoading}
            error={error}
            compact
          />
        )}
        {!hideEnvironment && <EnvironmentBadge compact hideProduction />}
      </div>
    </div>
  )
}

/**
 * Mobile footer layout
 */
function MobileFooter({
  health,
  isLoading,
  error,
  hideHealth,
  hideEnvironment,
  customLinks,
}: {
  health: any
  isLoading: boolean
  error: Error | null
  hideHealth?: boolean
  hideEnvironment?: boolean
  customLinks?: FooterLink[]
}) {
  return (
    <div className="space-y-3">
      <ProductInfo compact />
      <div className="flex items-center justify-between">
        {!hideHealth && (
          <SystemStatus
            health={health}
            loading={isLoading}
            error={error}
            compact
          />
        )}
        {!hideEnvironment && <EnvironmentBadge compact hideProduction />}
      </div>
      <QuickLinks links={customLinks} compact />
      <SupportLinks compact />
      <p className="text-xs text-gray-500">
        {FOOTER_BRANDING.copyrightPrefix} {FOOTER_BRANDING.defaultYear}{' '}
        {FOOTER_BRANDING.appName}
      </p>
    </div>
  )
}

/**
 * Tablet footer layout
 */
function TabletFooter({
  health,
  isLoading,
  error,
  hideHealth,
  hideEnvironment,
  customLinks,
}: {
  health: any
  isLoading: boolean
  error: Error | null
  hideHealth?: boolean
  hideEnvironment?: boolean
  customLinks?: FooterLink[]
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left column */}
      <div className="space-y-3">
        <ProductInfo compact />
        <QuickLinks links={customLinks} />
      </div>

      {/* Right column */}
      <div className="space-y-3">
        <div className="flex justify-end gap-2">
          {!hideHealth && (
            <SystemStatus
              health={health}
              loading={isLoading}
              error={error}
              compact
            />
          )}
          {!hideEnvironment && <EnvironmentBadge hideProduction />}
        </div>
        <div className="text-right">
          <SupportLinks />
        </div>
      </div>

      {/* Footer */}
      <p className="col-span-2 text-xs text-gray-500">
        {FOOTER_BRANDING.copyrightPrefix} {FOOTER_BRANDING.defaultYear}{' '}
        {FOOTER_BRANDING.appName}
      </p>
    </div>
  )
}

/**
 * Desktop footer layout
 */
function DesktopFooter({
  health,
  isLoading,
  error,
  hideHealth,
  hideEnvironment,
  customLinks,
}: {
  health: any
  isLoading: boolean
  error: Error | null
  hideHealth?: boolean
  hideEnvironment?: boolean
  customLinks?: FooterLink[]
}) {
  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Left column: Product info and quick links */}
      <div className="space-y-3 border-l pl-4">
        <ProductInfo />
        <QuickLinks links={customLinks} />
      </div>

      {/* Center column: System status */}
      <div className="flex items-center justify-center">
        {!hideHealth && (
          <SystemStatus
            health={health}
            loading={isLoading}
            error={error}
            compact={false}
          />
        )}
      </div>

      {/* Right column: Support links, environment, copyright */}
      <div className="space-y-3 border-l pl-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <SupportLinks />
          </div>
          {!hideEnvironment && (
            <EnvironmentBadge hideProduction />
          )}
        </div>
        <p className="text-xs text-gray-500">
          {FOOTER_BRANDING.copyrightPrefix} {FOOTER_BRANDING.defaultYear}{' '}
          {FOOTER_BRANDING.appName}
        </p>
      </div>
    </div>
  )
}

/**
 * AdminFooter Component
 * 
 * Main footer component with responsive layouts and system monitoring
 */
export function AdminFooter({
  className = '',
  hideHealth = false,
  hideEnvironment = false,
  customLinks,
}: AdminFooterProps) {
  // Get responsive state
  const responsive = useResponsive()

  // Get system health
  const { health, error, isLoading } = useSystemHealth({
    enabled: !hideHealth,
  })

  // Select layout based on breakpoint (kept for internal components)
  const isMobile = responsive.isMobile
  const isTablet = responsive.isTablet

  return (
    <footer
      role="contentinfo"
      aria-label="Admin footer"
      className={`footer-container border-t border-gray-200 bg-white transition-all duration-300 p-4 text-sm ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Always use the compact/simple footer across all admin pages to match sidebar footer height */}
        <SimpleFooter
          health={health}
          isLoading={isLoading}
          error={error}
          hideHealth={hideHealth}
          hideEnvironment={hideEnvironment}
          customLinks={customLinks}
        />
      </div>
    </footer>
  )
}

export default AdminFooter
