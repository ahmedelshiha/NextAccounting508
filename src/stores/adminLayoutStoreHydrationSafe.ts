/**
 * HYDRATION-SAFE Admin Layout Store
 * 
 * This store is designed to completely eliminate React Error #185 
 * by preventing all state mutations during hydration phase.
 */

'use client'

import { create } from 'zustand'
import { useEffect, useState } from 'react'

interface AdminLayoutState {
  // Sidebar state
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  
  // Navigation state
  activeItem: string
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Hydration safety
  isHydrated: boolean
}

interface AdminLayoutActions {
  // Sidebar actions
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  
  // Navigation actions  
  setActiveItem: (item: string) => void
  
  // UI actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Hydration action
  setHydrated: (hydrated: boolean) => void
}

type AdminLayoutStore = AdminLayoutState & AdminLayoutActions

// Default state - safe for SSR
const initialState: AdminLayoutState = {
  sidebarCollapsed: false, // Safe default for SSR
  sidebarOpen: false,
  activeItem: 'dashboard',
  isLoading: false,
  error: null,
  isHydrated: false, // Critical: starts false to prevent hydration issues
}

/**
 * Create the store WITHOUT any browser API access during creation
 * This ensures SSR/CSR consistency
 */
const useAdminLayoutStoreBase = create<AdminLayoutStore>((set, get) => ({
  ...initialState,
  
  // HYDRATION-SAFE: All actions check isHydrated before making changes
  setSidebarCollapsed: (collapsed: boolean) => {
    const state = get()
    if (!state.isHydrated) {
      console.warn('[AdminLayoutStore] setSidebarCollapsed called before hydration - ignoring')
      return
    }
    set({ sidebarCollapsed: collapsed })
  },
  
  setSidebarOpen: (open: boolean) => {
    const state = get()
    if (!state.isHydrated) {
      console.warn('[AdminLayoutStore] setSidebarOpen called before hydration - ignoring')
      return
    }
    set({ sidebarOpen: open })
  },
  
  toggleSidebar: () => {
    const state = get()
    if (!state.isHydrated) {
      console.warn('[AdminLayoutStore] toggleSidebar called before hydration - ignoring')
      return
    }
    set({ sidebarCollapsed: !state.sidebarCollapsed })
  },
  
  setActiveItem: (item: string) => {
    const state = get()
    if (!state.isHydrated) {
      console.warn('[AdminLayoutStore] setActiveItem called before hydration - ignoring')
      return
    }
    set({ activeItem: item })
  },
  
  setLoading: (loading: boolean) => {
    const state = get()
    if (!state.isHydrated) {
      console.warn('[AdminLayoutStore] setLoading called before hydration - ignoring')
      return
    }
    set({ isLoading: loading })
  },
  
  setError: (error: string | null) => {
    const state = get()
    if (!state.isHydrated) {
      console.warn('[AdminLayoutStore] setError called before hydration - ignoring')
      return
    }
    set({ error })
  },
  
  setHydrated: (hydrated: boolean) => {
    set({ isHydrated: hydrated })
  },
}))

/**
 * HYDRATION-SAFE hook that automatically manages hydration state
 * This is the main hook components should use
 */
export function useAdminLayoutHydrationSafe() {
  const store = useAdminLayoutStoreBase()
  const [isClient, setIsClient] = useState(false)
  
  // Track client-side hydration
  useEffect(() => {
    setIsClient(true)
    // Mark store as hydrated after client mount
    store.setHydrated(true)
    
    console.log('[AdminLayoutStore] Hydration completed - store operations now enabled')
  }, [store])
  
  // During SSR and before hydration, return safe defaults
  if (!isClient || !store.isHydrated) {
    return {
      sidebar: {
        collapsed: false, // Safe SSR default
        open: false,
        setCollapsed: () => {}, // No-op during hydration
        setOpen: () => {},
        toggle: () => {},
      },
      navigation: {
        activeItem: 'dashboard',
        setActiveItem: () => {}, // No-op during hydration
      },
      ui: {
        isLoading: false,
        error: null,
        setLoading: () => {},
        setError: () => {},
      },
      isHydrated: false,
    }
  }
  
  // After hydration, return fully functional store
  return {
    sidebar: {
      collapsed: store.sidebarCollapsed,
      open: store.sidebarOpen,
      setCollapsed: store.setSidebarCollapsed,
      setOpen: store.setSidebarOpen,
      toggle: store.toggleSidebar,
    },
    navigation: {
      activeItem: store.activeItem,
      setActiveItem: store.setActiveItem,
    },
    ui: {
      isLoading: store.isLoading,
      error: store.error,
      setLoading: store.setLoading,
      setError: store.setError,
    },
    isHydrated: store.isHydrated,
  }
}

/**
 * Legacy compatibility - but hydration-safe
 */
export const useAdminLayout = useAdminLayoutHydrationSafe