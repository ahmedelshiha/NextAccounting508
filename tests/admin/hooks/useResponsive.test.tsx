/**
 * useResponsive Hook Tests
 * Unit tests for responsive breakpoint detection and layout behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResponsive, useMediaQuery, useResponsiveClasses } from '@/hooks/admin/useResponsive'

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
})

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
})

// Mock window.matchMedia for media query tests
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
  writable: true,
})

describe('useResponsive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock window size
    Object.defineProperty(window, 'innerWidth', {
      value: 1280,
      writable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('returns default desktop configuration', () => {
    const { result } = renderHook(() => useResponsive())

    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isWide).toBe(false)
    expect(result.current.breakpoint).toBe('desktop')
    expect(result.current.layoutVariant).toBe('desktop')
    expect(result.current.sidebarBehavior).toBe('fixed')
  })

  it('detects mobile breakpoint correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
    
    const { result } = renderHook(() => useResponsive())

    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.breakpoint).toBe('mobile')
    expect(result.current.layoutVariant).toBe('mobile')
    expect(result.current.sidebarBehavior).toBe('overlay')
    expect(result.current.sidebarWidth).toBe(288) // Mobile sidebar width
  })

  it('detects tablet breakpoint correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 900, writable: true })
    
    const { result } = renderHook(() => useResponsive())

    expect(result.current.isTablet).toBe(true)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.breakpoint).toBe('tablet')
    expect(result.current.layoutVariant).toBe('tablet')
    expect(result.current.sidebarBehavior).toBe('push')
    expect(result.current.sidebarWidth).toBe(256) // Desktop sidebar width
  })

  it('detects wide breakpoint correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1600, writable: true })
    
    const { result } = renderHook(() => useResponsive())

    expect(result.current.isWide).toBe(true)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.breakpoint).toBe('wide')
    expect(result.current.layoutVariant).toBe('desktop') // Wide still uses desktop layout
    expect(result.current.sidebarBehavior).toBe('fixed')
  })

  it('provides correct window size information', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 900, writable: true })
    
    const { result } = renderHook(() => useResponsive())

    expect(result.current.windowSize).toEqual({
      width: 1200,
      height: 900,
    })
  })

  it('accepts custom configuration', () => {
    const customConfig = {
      mobileBreakpoint: 600,
      tabletBreakpoint: 900,
      sidebarDesktopWidth: 300,
    }

    const { result } = renderHook(() => useResponsive(customConfig))

    expect(result.current.config.mobileBreakpoint).toBe(600)
    expect(result.current.config.tabletBreakpoint).toBe(900)
    expect(result.current.config.sidebarDesktopWidth).toBe(300)
  })

  it('sets up resize listener on mount', () => {
    renderHook(() => useResponsive())

    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('cleans up resize listener on unmount', () => {
    const { unmount } = renderHook(() => useResponsive())

    unmount()

    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('debounces resize events', () => {
    vi.useFakeTimers()
    
    const { result } = renderHook(() => useResponsive())
    
    // Get the resize handler
    const resizeHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'resize'
    )?.[1]

    // Simulate rapid resize events
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
    act(() => {
      resizeHandler?.()
      resizeHandler?.()
      resizeHandler?.()
    })

    // Should not update immediately (debounced)
    expect(result.current.isMobile).toBe(true) // Initial state

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(200) // Should update after debounce delay
    })

    vi.useRealTimers()
  })

  describe('helper functions', () => {
    it('isBreakpoint helper works correctly', () => {
      const { result } = renderHook(() => useResponsive())

      expect(result.current.isBreakpoint('desktop')).toBe(true)
      expect(result.current.isBreakpoint('mobile')).toBe(false)
      expect(result.current.isBreakpoint('tablet')).toBe(false)
    })

    it('isAtLeast helper works correctly', () => {
      const { result } = renderHook(() => useResponsive())

      expect(result.current.isAtLeast('mobile')).toBe(true)
      expect(result.current.isAtLeast('tablet')).toBe(true)
      expect(result.current.isAtLeast('desktop')).toBe(true)
      expect(result.current.isAtLeast('wide')).toBe(false)
    })

    it('isAtMost helper works correctly', () => {
      const { result } = renderHook(() => useResponsive())

      expect(result.current.isAtMost('mobile')).toBe(false)
      expect(result.current.isAtMost('tablet')).toBe(false)
      expect(result.current.isAtMost('desktop')).toBe(true)
      expect(result.current.isAtMost('wide')).toBe(true)
    })
  })
})

describe('useResponsiveClasses', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
  })

  it('generates correct CSS classes for desktop', () => {
    const { result } = renderHook(() => useResponsiveClasses())

    expect(result.current.current).toBe('desktop')
    expect(result.current.desktop).toBe('desktop')
    expect(result.current.mobile).toBe('')
    expect(result.current.tabletAndUp).toBe('tablet-and-up')
    expect(result.current.desktopAndUp).toBe('desktop-and-up')
    expect(result.current.sidebar.fixed).toBe('sidebar-fixed')
    expect(result.current.sidebar.overlay).toBe('')
  })

  it('generates correct CSS classes for mobile', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
    
    const { result } = renderHook(() => useResponsiveClasses())

    expect(result.current.current).toBe('mobile')
    expect(result.current.mobile).toBe('mobile')
    expect(result.current.desktop).toBe('')
    expect(result.current.mobileOnly).toBe('mobile-only')
    expect(result.current.tabletAndUp).toBe('hidden')
    expect(result.current.sidebar.overlay).toBe('sidebar-overlay')
    expect(result.current.sidebar.fixed).toBe('')
  })

  it('generates correct CSS classes for tablet', () => {
    Object.defineProperty(window, 'innerWidth', { value: 900, writable: true })
    
    const { result } = renderHook(() => useResponsiveClasses())

    expect(result.current.current).toBe('tablet')
    expect(result.current.tablet).toBe('tablet')
    expect(result.current.tabletOnly).toBe('tablet-only')
    expect(result.current.tabletAndUp).toBe('tablet-and-up')
    expect(result.current.tabletAndDown).toBe('tablet-and-down')
    expect(result.current.sidebar.push).toBe('sidebar-push')
  })
})

describe('useMediaQuery', () => {
  beforeEach(() => {
    mockMatchMedia.mockReset()
  })

  it('returns correct initial state', () => {
    const mockMediaQueryList = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(true)
    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px)')
  })

  it('updates when media query changes', () => {
    const listeners: Array<(event: { matches: boolean }) => void> = []
    const mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn((event, listener) => {
        listeners.push(listener)
      }),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(false)

    // Simulate media query change
    act(() => {
      listeners.forEach(listener => listener({ matches: true }))
    })

    expect(result.current).toBe(true)
  })

  it('cleans up event listeners on unmount', () => {
    const mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    unmount()

    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled()
  })

  it('handles legacy browser API', () => {
    const mockMediaQueryList = {
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      // No addEventListener/removeEventListener
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(mockMediaQueryList.addListener).toHaveBeenCalled()

    unmount()

    expect(mockMediaQueryList.removeListener).toHaveBeenCalled()
  })

  it('returns false when window is not available', () => {
    // Temporarily remove window
    const originalWindow = global.window
    // @ts-ignore
    delete global.window

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(false)

    // Restore window
    global.window = originalWindow
  })
})