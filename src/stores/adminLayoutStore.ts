/**
 * Admin Layout Store using Zustand
 * Centralized state management for admin dashboard layout
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import type { 
  AdminLayoutState,
  ResponsiveBreakpoint,
  LayoutVariant 
} from '@/types/admin/layout'
import type {
  NotificationItem,
  NavigationItem,
  QuickAction
} from '@/types/admin/navigation'

/**
 * Complete admin layout state interface
 */
export interface AdminLayoutStore extends AdminLayoutState {
  // Navigation state
  navigationItems: NavigationItem[]
  searchQuery: string
  searchResults: any[]
  isSearching: boolean
  
  // Notifications
  notifications: NotificationItem[]
  unreadNotificationCount: number
  
  // Quick actions
  quickActions: QuickAction[]
  
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
  
  // Responsive actions
  updateBreakpoint: (breakpoint: ResponsiveBreakpoint) => void
  updateLayoutVariant: (variant: LayoutVariant) => void
  setResponsiveState: (state: {
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    breakpoint: ResponsiveBreakpoint
    layoutVariant: LayoutVariant
  }) => void
  
  // Search actions
  setSearchQuery: (query: string) => void
  setSearchResults: (results: any[]) => void
  setIsSearching: (searching: boolean) => void
  clearSearch: () => void
  
  // Notification actions
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => void
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
  removeNotification: (notificationId: string) => void
  clearNotifications: () => void
  
  // Navigation actions
  setNavigationItems: (items: NavigationItem[]) => void
  
  // Quick action methods
  setQuickActions: (actions: QuickAction[]) => void
  
  // UI actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Reset actions
  reset: () => void
}

/**
 * Initial state for the admin layout store
 */
const initialState: AdminLayoutState = {
  sidebarCollapsed: false,
  sidebarOpen: false,
  activeNavItem: null,
  expandedGroups: ['dashboard', 'business-operations'], // Default expanded groups
  breakpoint: 'desktop',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  layoutVariant: 'desktop',
}

/**
 * Admin layout store with Zustand
 * Provides centralized state management for the entire admin layout system
 */
export const useAdminLayoutStore = create<AdminLayoutStore>()(
  subscribeWithSelector(
    // Only use persist on client-side to avoid hydration issues
    typeof window !== 'undefined' 
      ? persist(
      (set, get) => ({
        // Initial state
        ...initialState,
        navigationItems: [],
        searchQuery: '',
        searchResults: [],
        isSearching: false,
        notifications: [],
        unreadNotificationCount: 0,
        quickActions: [],
        isLoading: false,
        error: null,

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

        // Responsive actions
        updateBreakpoint: (breakpoint: ResponsiveBreakpoint) => set({
          breakpoint,
        }),

        updateLayoutVariant: (variant: LayoutVariant) => set({
          layoutVariant: variant,
        }),

        setResponsiveState: (state) => set(state),

        // Search actions
        setSearchQuery: (query: string) => set({
          searchQuery: query,
        }),

        setSearchResults: (results: any[]) => set({
          searchResults: results,
        }),

        setIsSearching: (searching: boolean) => set({
          isSearching: searching,
        }),

        clearSearch: () => set({
          searchQuery: '',
          searchResults: [],
          isSearching: false,
        }),

        // Notification actions
        addNotification: (notificationData) => {
          const notification: NotificationItem = {
            ...notificationData,
            id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
          }

          set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadNotificationCount: state.unreadNotificationCount + 1,
          }))
        },

        markNotificationRead: (notificationId: string) => set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId)
          if (!notification || notification.read) return state

          return {
            notifications: state.notifications.map(n =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
          }
        }),

        markAllNotificationsRead: () => set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadNotificationCount: 0,
        })),

        removeNotification: (notificationId: string) => set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId)
          const wasUnread = notification && !notification.read

          return {
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadNotificationCount: wasUnread 
              ? Math.max(0, state.unreadNotificationCount - 1)
              : state.unreadNotificationCount,
          }
        }),

        clearNotifications: () => set({
          notifications: [],
          unreadNotificationCount: 0,
        }),

        // Navigation management
        setNavigationItems: (items: NavigationItem[]) => set({
          navigationItems: items,
        }),

        // Quick actions
        setQuickActions: (actions: QuickAction[]) => set({
          quickActions: actions,
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
          navigationItems: [],
          searchQuery: '',
          searchResults: [],
          isSearching: false,
          notifications: [],
          unreadNotificationCount: 0,
          quickActions: [],
          isLoading: false,
          error: null,
        }),
      }),
      {
        name: 'admin-layout-store', // localStorage key
        partialize: (state) => ({
          // Only persist certain state
          sidebarCollapsed: state.sidebarCollapsed,
          expandedGroups: state.expandedGroups,
          notifications: state.notifications.slice(0, 50), // Limit persisted notifications
        }),
      }
    )
  )
)

/**
 * Selector hooks for better performance
 * These hooks only re-render when specific state changes
 */

// Sidebar state selector
export const useSidebarState = () => useAdminLayoutStore((state) => ({
  collapsed: state.sidebarCollapsed,
  open: state.sidebarOpen,
  toggle: state.toggleSidebar,
  setCollapsed: state.setSidebarCollapsed,
  setOpen: state.setSidebarOpen,
}))

// Navigation state selector
export const useNavigationState = () => useAdminLayoutStore((state) => ({
  items: state.navigationItems,
  activeItem: state.activeNavItem,
  expandedGroups: state.expandedGroups,
  setActiveItem: state.setActiveNavItem,
  toggleGroup: state.toggleNavigationGroup,
  setItems: state.setNavigationItems,
}))

// Search state selector
export const useSearchState = () => useAdminLayoutStore((state) => ({
  query: state.searchQuery,
  results: state.searchResults,
  isSearching: state.isSearching,
  setQuery: state.setSearchQuery,
  setResults: state.setSearchResults,
  setSearching: state.setIsSearching,
  clearSearch: state.clearSearch,
}))

// Notification state selector
export const useNotificationState = () => useAdminLayoutStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.unreadNotificationCount,
  add: state.addNotification,
  markRead: state.markNotificationRead,
  markAllRead: state.markAllNotificationsRead,
  remove: state.removeNotification,
  clear: state.clearNotifications,
}))

// Responsive state selector
export const useResponsiveState = () => useAdminLayoutStore((state) => ({
  breakpoint: state.breakpoint,
  layoutVariant: state.layoutVariant,
  isMobile: state.isMobile,
  isTablet: state.isTablet,
  isDesktop: state.isDesktop,
  updateBreakpoint: state.updateBreakpoint,
  updateLayoutVariant: state.updateLayoutVariant,
  setResponsiveState: state.setResponsiveState,
}))

// UI state selector
export const useUIState = () => useAdminLayoutStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
  setLoading: state.setLoading,
  setError: state.setError,
}))

/**
 * Combined hook for admin layout management
 * Provides access to responsive state and layout control
 */
export const useAdminLayout = () => {
  const sidebarState = useSidebarState()
  const navigationState = useNavigationState()
  const responsiveState = useResponsiveState()
  const uiState = useUIState()

  return {
    sidebar: sidebarState,
    navigation: navigationState,
    responsive: responsiveState,
    ui: uiState,
  }
}