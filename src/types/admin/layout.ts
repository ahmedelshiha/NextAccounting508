/**
 * Layout Types for Admin Dashboard
 * Comprehensive type definitions for admin layout system
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

import { ReactNode } from 'react'

/**
 * Admin layout configuration and state
 */
export interface AdminLayoutState {
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean
  
  /** Whether sidebar is open on mobile */
  sidebarOpen: boolean
  
  /** Currently active navigation item */
  activeNavItem: string | null
  
  /** Expanded navigation groups */
  expandedGroups: string[]
  
  /** Current responsive breakpoint */
  breakpoint: ResponsiveBreakpoint
  
  /** Whether user is on mobile device */
  isMobile: boolean
  
  /** Whether user is on tablet device */
  isTablet: boolean
  
  /** Whether user is on desktop device */
  isDesktop: boolean
  
  /** Layout variant being used */
  layoutVariant: LayoutVariant
}

/**
 * Responsive breakpoint identifiers
 */
export type ResponsiveBreakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide'

/**
 * Layout behavior variants based on screen size
 */
export type LayoutVariant = 'mobile' | 'tablet' | 'desktop'

/**
 * Sidebar behavior types
 */
export type SidebarBehavior = 'overlay' | 'push' | 'fixed'

/**
 * Props for AdminDashboardLayout component
 */
export interface AdminDashboardLayoutProps {
  /** Child components to render in the main content area */
  children: ReactNode
  
  /** User session data */
  session?: any
  
  /** Initial sidebar state */
  initialSidebarCollapsed?: boolean
  
  /** Custom CSS classes */
  className?: string
}

/**
 * Props for AdminSidebar component
 */
export interface AdminSidebarProps {
  /** Whether sidebar is collapsed */
  collapsed: boolean
  
  /** Function to toggle sidebar */
  onToggle: () => void
  
  /** Whether user is on mobile device */
  isMobile: boolean
  
  /** Whether sidebar is open (mobile) */
  isOpen?: boolean
  
  /** Function to close sidebar (mobile) */
  onClose?: () => void
  
  /** Custom CSS classes */
  className?: string
}

/**
 * Props for AdminHeader component
 */
export interface AdminHeaderProps {
  /** Function to toggle sidebar */
  onToggleSidebar: () => void
  
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean
  
  /** Whether user is on mobile device */
  isMobile: boolean
  
  /** Current user data */
  user?: any
  
  /** Custom CSS classes */
  className?: string
}

/**
 * Props for ContentWrapper component
 */
export interface ContentWrapperProps {
  /** Child components */
  children: ReactNode
  
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean
  
  /** Current responsive breakpoint */
  breakpoint: ResponsiveBreakpoint
  
  /** Custom CSS classes */
  className?: string
}

/**
 * Touch gesture event data
 */
export interface TouchGestureData {
  /** Touch start position */
  startX: number
  
  /** Touch end position */
  endX: number
  
  /** Touch start time */
  startTime: number
  
  /** Touch end time */
  endTime: number
  
  /** Gesture direction */
  direction: 'left' | 'right' | 'up' | 'down' | null
  
  /** Gesture distance */
  distance: number
  
  /** Gesture velocity */
  velocity: number
}

/**
 * Mobile sidebar configuration
 */
export interface MobileSidebarConfig {
  /** Whether to enable swipe gestures */
  enableSwipeGestures: boolean
  
  /** Minimum swipe distance to trigger action */
  minSwipeDistance: number
  
  /** Maximum swipe time for gesture recognition */
  maxSwipeTime: number
  
  /** Backdrop opacity */
  backdropOpacity: number
  
  /** Animation duration in ms */
  animationDuration: number
}

/**
 * Layout responsive configuration
 */
export interface ResponsiveConfig {
  /** Mobile breakpoint */
  mobileBreakpoint: number
  
  /** Tablet breakpoint */
  tabletBreakpoint: number
  
  /** Desktop breakpoint */
  desktopBreakpoint: number
  
  /** Wide screen breakpoint */
  wideBreakpoint: number
  
  /** Sidebar width on desktop */
  sidebarDesktopWidth: number
  
  /** Collapsed sidebar width */
  sidebarCollapsedWidth: number
  
  /** Sidebar width on mobile */
  sidebarMobileWidth: number
  
  /** Header height */
  headerHeight: number
}

/**
 * Animation configuration for layout transitions
 */
export interface AnimationConfig {
  /** Sidebar toggle animation duration */
  sidebarToggleDuration: number
  
  /** Page transition duration */
  pageTransitionDuration: number
  
  /** Hover animation duration */
  hoverDuration: number
  
  /** Animation easing function */
  easing: string
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /** Whether to announce route changes */
  announceRouteChanges: boolean
  
  /** Whether to enable keyboard navigation */
  enableKeyboardNavigation: boolean
  
  /** Focus trap configuration */
  focusTrap: boolean
  
  /** Skip link configuration */
  skipLinks: boolean
  
  /** High contrast mode support */
  highContrastMode: boolean
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  /** Whether to enable virtual scrolling for long lists */
  enableVirtualScrolling: boolean
  
  /** Whether to lazy load navigation items */
  lazyLoadNavigation: boolean
  
  /** Debounce delay for search */
  searchDebounceDelay: number
  
  /** Whether to enable component memoization */
  enableMemoization: boolean
}