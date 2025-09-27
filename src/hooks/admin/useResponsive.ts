/**
 * Responsive Hook for Admin Dashboard
 * Manages responsive behavior and breakpoint detection
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { 
  ResponsiveBreakpoint, 
  LayoutVariant, 
  SidebarBehavior,
  ResponsiveConfig 
} from '@/types/admin/layout'

/**
 * Default responsive configuration
 */
const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1280,
  wideBreakpoint: 1536,
  sidebarDesktopWidth: 256, // 16rem
  sidebarCollapsedWidth: 64,  // 4rem
  sidebarMobileWidth: 288,   // 18rem
  headerHeight: 64,          // 4rem
}

/**
 * Return type for useResponsive hook
 */
export interface UseResponsiveReturn {
  // Screen size detection
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isWide: boolean
  
  // Current breakpoint
  breakpoint: ResponsiveBreakpoint
  layoutVariant: LayoutVariant
  
  // Sidebar behavior
  sidebarBehavior: SidebarBehavior
  sidebarWidth: number
  
  // Window dimensions
  windowSize: {
    width: number
    height: number
  }
  
  // Responsive utilities
  config: ResponsiveConfig
  
  // Helper functions
  isBreakpoint: (bp: ResponsiveBreakpoint) => boolean
  isAtLeast: (bp: ResponsiveBreakpoint) => boolean
  isAtMost: (bp: ResponsiveBreakpoint) => boolean
}

/**
 * Custom hook for responsive behavior in admin dashboard
 * Provides comprehensive screen size detection and layout configuration
 */
export const useResponsive = (
  customConfig?: Partial<ResponsiveConfig>
): UseResponsiveReturn => {
  // Merge custom config with defaults
  const config = useMemo(() => ({
    ...DEFAULT_RESPONSIVE_CONFIG,
    ...customConfig,
  }), [customConfig])

  // Track window size - initialize with server-safe defaults
  // Always use the same initial values for SSR/CSR consistency
  const [windowSize, setWindowSize] = useState({
    width: 1024, // Fixed default to prevent hydration mismatch
    height: 768, // Fixed default to prevent hydration mismatch
  })
  
  // Track if we're on client to prevent SSR issues
  const [isClient, setIsClient] = useState(false)

  // Update window size
  const updateSize = useCallback(() => {
    if (typeof window === 'undefined') return
    
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })
  }, [])

  // Client-side hydration effect
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Set up resize listener
  useEffect(() => {
    // Skip if running on server
    if (typeof window === 'undefined') return

    // Initial size - only set after client-side hydration
    if (isClient) {
      updateSize()
    }

    // Debounced resize handler to improve performance
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateSize, 150)
    }

    window.addEventListener('resize', debouncedResize)
    
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [updateSize, isClient])

  // Calculate responsive states
  const responsiveState = useMemo(() => {
    const { width } = windowSize
    const {
      mobileBreakpoint,
      tabletBreakpoint,
      desktopBreakpoint,
      wideBreakpoint,
      sidebarDesktopWidth,
      sidebarCollapsedWidth,
      sidebarMobileWidth,
    } = config

    // Screen size detection
    const isMobile = width < mobileBreakpoint
    const isTablet = width >= mobileBreakpoint && width < tabletBreakpoint
    const isDesktop = width >= tabletBreakpoint && width < desktopBreakpoint
    const isWide = width >= wideBreakpoint

    // Determine current breakpoint
    let breakpoint: ResponsiveBreakpoint
    if (isMobile) breakpoint = 'mobile'
    else if (isTablet) breakpoint = 'tablet'
    else if (isDesktop) breakpoint = 'desktop'
    else breakpoint = 'wide'

    // Determine layout variant (simplified)
    let layoutVariant: LayoutVariant
    if (isMobile) layoutVariant = 'mobile'
    else if (isTablet) layoutVariant = 'tablet'
    else layoutVariant = 'desktop'

    // Determine sidebar behavior
    let sidebarBehavior: SidebarBehavior
    if (isMobile) sidebarBehavior = 'overlay'
    else if (isTablet) sidebarBehavior = 'push'
    else sidebarBehavior = 'fixed'

    // Determine sidebar width
    let sidebarWidth: number
    if (isMobile) sidebarWidth = sidebarMobileWidth
    else sidebarWidth = sidebarDesktopWidth

    return {
      isMobile,
      isTablet,
      isDesktop,
      isWide,
      breakpoint,
      layoutVariant,
      sidebarBehavior,
      sidebarWidth,
    }
  }, [windowSize, config])

  // Helper functions
  const isBreakpoint = useCallback((bp: ResponsiveBreakpoint): boolean => {
    return responsiveState.breakpoint === bp
  }, [responsiveState.breakpoint])

  const isAtLeast = useCallback((bp: ResponsiveBreakpoint): boolean => {
    const breakpoints = ['mobile', 'tablet', 'desktop', 'wide'] as const
    const currentIndex = breakpoints.indexOf(responsiveState.breakpoint)
    const targetIndex = breakpoints.indexOf(bp)
    return currentIndex >= targetIndex
  }, [responsiveState.breakpoint])

  const isAtMost = useCallback((bp: ResponsiveBreakpoint): boolean => {
    const breakpoints = ['mobile', 'tablet', 'desktop', 'wide'] as const
    const currentIndex = breakpoints.indexOf(responsiveState.breakpoint)
    const targetIndex = breakpoints.indexOf(bp)
    return currentIndex <= targetIndex
  }, [responsiveState.breakpoint])

  return {
    ...responsiveState,
    windowSize,
    config,
    isBreakpoint,
    isAtLeast,
    isAtMost,
  }
}

/**
 * Hook for responsive CSS classes
 * Generates responsive class names based on current breakpoint
 */
export const useResponsiveClasses = (
  customConfig?: Partial<ResponsiveConfig>
) => {
  const { breakpoint, isMobile, isTablet, isDesktop, isWide } = useResponsive(customConfig)

  const classes = useMemo(() => ({
    // Breakpoint-specific classes
    mobile: isMobile ? 'mobile' : '',
    tablet: isTablet ? 'tablet' : '',
    desktop: isDesktop ? 'desktop' : '',
    wide: isWide ? 'wide' : '',
    
    // Current breakpoint class
    current: breakpoint,
    
    // Helper classes
    mobileOnly: isMobile ? 'mobile-only' : 'hidden',
    tabletOnly: isTablet ? 'tablet-only' : 'hidden',
    desktopOnly: isDesktop ? 'desktop-only' : 'hidden',
    wideOnly: isWide ? 'wide-only' : 'hidden',
    
    // Range classes
    tabletAndUp: (isTablet || isDesktop || isWide) ? 'tablet-and-up' : 'hidden',
    desktopAndUp: (isDesktop || isWide) ? 'desktop-and-up' : 'hidden',
    tabletAndDown: (isMobile || isTablet) ? 'tablet-and-down' : 'hidden',
    
    // Layout classes
    sidebar: {
      overlay: isMobile ? 'sidebar-overlay' : '',
      push: isTablet ? 'sidebar-push' : '',
      fixed: (isDesktop || isWide) ? 'sidebar-fixed' : '',
    },
  }), [breakpoint, isMobile, isTablet, isDesktop, isWide])

  return classes
}

/**
 * Hook for media query matching
 * Provides programmatic media query functionality
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)

    // Listen for changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Use deprecated addListener for broader compatibility
    if (media.addEventListener) {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    } else {
      // Fallback for older browsers
      media.addListener(listener)
      return () => media.removeListener(listener)
    }
  }, [query])

  return matches
}

/**
 * Predefined media query hooks
 */
export const useMediaQueries = (customConfig?: Partial<ResponsiveConfig>) => {
  const config = useMemo(() => ({
    ...DEFAULT_RESPONSIVE_CONFIG,
    ...customConfig,
  }), [customConfig])

  const isMobile = useMediaQuery(`(max-width: ${config.mobileBreakpoint - 1}px)`)
  const isTablet = useMediaQuery(
    `(min-width: ${config.mobileBreakpoint}px) and (max-width: ${config.tabletBreakpoint - 1}px)`
  )
  const isDesktop = useMediaQuery(
    `(min-width: ${config.tabletBreakpoint}px) and (max-width: ${config.desktopBreakpoint - 1}px)`
  )
  const isWide = useMediaQuery(`(min-width: ${config.wideBreakpoint}px)`)
  
  const isTabletAndUp = useMediaQuery(`(min-width: ${config.mobileBreakpoint}px)`)
  const isDesktopAndUp = useMediaQuery(`(min-width: ${config.tabletBreakpoint}px)`)

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isTabletAndUp,
    isDesktopAndUp,
  }
}