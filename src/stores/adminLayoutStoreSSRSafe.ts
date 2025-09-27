/**
 * SSR-Safe Admin Layout Store using Zustand
 * Temporary store without persistence to eliminate hydration issues
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

import { create } from 'zustand'
import type { 
  AdminLayoutState,
  ResponsiveBreakpoint,
  LayoutVariant 
} from '@/types/admin/layout'

/**
 * Simplified admin layout state interface without persistence
 */
interface AdminLayoutStoreSSRSafe {
  // Layout state
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  activeNavItem: string | null
  expandedGroups: string[]
  breakpoint: ResponsiveBreakpoint
  layoutVariant: LayoutVariant
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setActiveNavItem: (itemId: string | null) => void
  toggleNavigationGroup: (groupId: string) => void
  setExpandedGroups: (groups: string[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

/**
 * Default state values
 */
const initialState = {
  sidebarCollapsed: false,
  sidebarOpen: false,
  activeNavItem: null,
  expandedGroups: [],
  breakpoint: 'desktop' as ResponsiveBreakpoint,
  layoutVariant: 'desktop' as LayoutVariant,
  isLoading: false,
  error: null,
}

/**
 * SSR-Safe admin layout store with Zustand (no persistence)
 * This store is designed to work correctly with SSR without causing hydration issues
 */
export const useAdminLayoutStoreSSRSafe = create<AdminLayoutStoreSSRSafe>((set, get) => ({
  // Initial state
  ...initialState,

  // Sidebar actions
  toggleSidebar: () => set((state) => ({
    sidebarCollapsed: !state.sidebarCollapsed,
  })),

  setSidebarCollapsed: (collapsed: boolean) => set({
    sidebarCollapsed: collapsed,
  }),

  setSidebarOpen: (open: boolean) => set({
    sidebarOpen: open,
  }),

  // Navigation actions
  setActiveNavItem: (itemId: string | null) => set({
    activeNavItem: itemId,
  }),

  toggleNavigationGroup: (groupId: string) => set((state) => {
    const isExpanded = state.expandedGroups.includes(groupId)
    return {
      expandedGroups: isExpanded
        ? state.expandedGroups.filter(id => id !== groupId)
        : [...state.expandedGroups, groupId],
    }
  }),

  setExpandedGroups: (groups: string[]) => set({
    expandedGroups: groups,
  }),

  // UI actions
  setLoading: (loading: boolean) => set({
    isLoading: loading,
  }),

  setError: (error: string | null) => set({
    error,
  }),

  // Reset all state
  reset: () => set({
    ...initialState,
  }),
}))

/**
 * Convenience hook that matches the original store API
 */
export const useAdminLayout = () => {
  const store = useAdminLayoutStoreSSRSafe()
  
  return {
    sidebar: {
      collapsed: store.sidebarCollapsed,
      open: store.sidebarOpen,
      toggle: store.toggleSidebar,
      setCollapsed: store.setSidebarCollapsed,
      setOpen: store.setSidebarOpen,
    },
    navigation: {
      activeItem: store.activeNavItem,
      expandedGroups: store.expandedGroups,
      setActiveItem: store.setActiveNavItem,
      toggleGroup: store.toggleNavigationGroup,
      setExpandedGroups: store.setExpandedGroups,
    },
    ui: {
      isLoading: store.isLoading,
      error: store.error,
      setLoading: store.setLoading,
      setError: store.setError,
    },
  }
}