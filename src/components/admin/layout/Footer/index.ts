/**
 * Admin Footer - Barrel Export
 * 
 * Convenient re-export of all footer components, utilities, and types
 * 
 * @module @/components/admin/layout/Footer
 */

// Main component
export { AdminFooter } from './AdminFooter'

// Sub-components
export { SystemStatus } from './SystemStatus'
export { ProductInfo } from './ProductInfo'
export { QuickLinks } from './QuickLinks'
export { SupportLinks } from './SupportLinks'
export { EnvironmentBadge } from './EnvironmentBadge'

// Types
export type {
  SystemHealth,
  HealthCheck,
  FooterLink,
  AdminFooterProps,
  SystemStatusProps,
  ProductInfoProps,
  QuickLinksProps,
  SupportLinksProps,
  EnvironmentBadgeProps,
  UseSystemHealthOptions,
  UseSystemHealthReturn,
  SystemHealthResponse,
} from './types'

// Constants
export {
  FOOTER_LINKS,
  HEALTH_CHECK_CONFIG,
  STATUS_MESSAGES,
  ENVIRONMENT_COLORS,
  ENVIRONMENT_DESCRIPTIONS,
  FOOTER_SIZES,
  ANIMATION_TIMINGS,
  FOOTER_BRANDING,
} from './constants'
