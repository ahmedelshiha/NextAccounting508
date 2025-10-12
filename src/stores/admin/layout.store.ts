"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'

export type ResponsiveBreakpoint = 'mobile' | 'tablet' | 'desktop'
export type LayoutVariant = 'mobile' | 'tablet' | 'desktop'

interface StoreState {
  // Sidebar
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  expandedGroups: string[]

  // Navigation
  activeItem: string | null

  // Responsive
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: ResponsiveBreakpoint
  layoutVariant: LayoutVariant

  // UI
  isLoading: boolean
  error: string | null

  // Hydration
  isHydrated: boolean
}

interface StoreActions {
  // Sidebar
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  toggleNavigationGroup: (groupId: string) => void
  setExpandedGroups: (groups: string[]) => void

  // Navigation
  setActiveItem: (itemId: string | null) => void

  // Responsive
  setResponsiveState: (s: Partial<Pick<StoreState, 'isMobile' | 'isTablet' | 'isDesktop' | 'breakpoint' | 'layoutVariant'>>) => void

  // UI
  setLoading: (loading: boolean) => void
  setError: (err: string | null) => void

  // Hydration
  setHydrated: (hydrated: boolean) => void

  // Reset
  reset: () => void
}

const initialState: StoreState = {
  sidebarCollapsed: false,
  sidebarOpen: false,
  expandedGroups: ['dashboard'],
  activeItem: null,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  breakpoint: 'desktop',
  layoutVariant: 'desktop',
  isLoading: false,
  error: null,
  isHydrated: false,
}

const base = create<StoreState & StoreActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,
        // Sidebar
        setSidebarCollapsed: (collapsed) => {
          if (!get().isHydrated) return
          set({ sidebarCollapsed: collapsed })
        },
        setSidebarOpen: (open) => {
          if (!get().isHydrated) return
          set({ sidebarOpen: open })
        },
        toggleSidebar: () => {
          if (!get().isHydrated) return
          set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
        },
        toggleNavigationGroup: (groupId) => {
          if (!get().isHydrated) return
          set((s) => {
            const isExpanded = s.expandedGroups.includes(groupId)
            return { expandedGroups: isExpanded ? s.expandedGroups.filter(g => g !== groupId) : [...s.expandedGroups, groupId] }
          })
        },
        setExpandedGroups: (groups) => {
          if (!get().isHydrated) return
          set({ expandedGroups: groups })
        },

        // Navigation
        setActiveItem: (itemId) => {
          if (!get().isHydrated) return
          set({ activeItem: itemId })
        },

        // Responsive
        setResponsiveState: (s) => {
          if (!get().isHydrated) return
          set(s as any)
        },

        // UI
        setLoading: (loading) => {
          if (!get().isHydrated) return
          set({ isLoading: loading })
        },
        setError: (err) => {
          if (!get().isHydrated) return
          set({ error: err })
        },

        // Hydration
        setHydrated: (hydrated) => set({ isHydrated: hydrated }),

        reset: () => set({ ...initialState }),
      }),
      {
        name: 'admin:layout',
        partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, expandedGroups: s.expandedGroups }),
      }
    )
  )
)

// Selector helpers
export const useSidebarState = () => base((s) => ({
  collapsed: s.sidebarCollapsed,
  open: s.sidebarOpen,
  setCollapsed: s.setSidebarCollapsed,
  setOpen: s.setSidebarOpen,
  toggle: s.toggleSidebar,
  setExpandedGroups: s.setExpandedGroups,
  toggleGroup: s.toggleNavigationGroup,
  expandedGroups: s.expandedGroups,
}))

export const useNavigationState = () => base((s) => ({
  activeItem: s.activeItem,
  setActiveItem: s.setActiveItem,
}))

export const useUIState = () => base((s) => ({
  isLoading: s.isLoading,
  error: s.error,
  setLoading: s.setLoading,
  setError: s.setError,
}))

export function useAdminLayoutSafe() {
  const store = base.getState()
  const isHydrated = base((s) => s.isHydrated)
  // Hydrate on client
  if (typeof window !== 'undefined' && !isHydrated) {
    // Trigger once per client mount
    Promise.resolve().then(() => base.getState().setHydrated(true))
  }

  if (!isHydrated) {
    return {
      sidebar: { collapsed: false, open: false, setCollapsed: () => {}, setOpen: () => {}, toggle: () => {}, expandedGroups: [], toggleGroup: () => {}, setExpandedGroups: () => {} },
      navigation: { activeItem: null, setActiveItem: () => {} },
      ui: { isLoading: false, error: null, setLoading: () => {}, setError: () => {} },
      isHydrated: false,
    }
  }

  return {
    sidebar: useSidebarState(),
    navigation: useNavigationState(),
    ui: useUIState(),
    isHydrated: true,
  }
}
