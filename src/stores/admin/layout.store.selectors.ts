import { useEffect, useState } from 'react'
import { useAdminLayoutStore } from './layout.store'

export const useSidebarCollapsed = () => useAdminLayoutStore(state => state.sidebar.collapsed)
export const useSidebarWidth = () => useAdminLayoutStore(state => state.sidebar.width)
export const useMobileOpen = () => useAdminLayoutStore(state => state.sidebar.mobileOpen)
export const useExpandedGroups = () => useAdminLayoutStore(state => state.sidebar.expandedGroups)

export const useSidebarState = () => useAdminLayoutStore(state => state.sidebar)

export const useSidebarActions = () => ({
  toggleSidebar: useAdminLayoutStore(state => state.toggleSidebar),
  setCollapsed: useAdminLayoutStore(state => state.setCollapsed),
  setWidth: useAdminLayoutStore(state => state.setWidth),
  setMobileOpen: useAdminLayoutStore(state => state.setMobileOpen),
  toggleGroup: useAdminLayoutStore(state => state.toggleGroup),
  setExpandedGroups: useAdminLayoutStore(state => state.setExpandedGroups),
})

// SSR-safe hook for components that render on server
export function useSidebarStateSSR() {
  const [hydrated, setHydrated] = useState(false)
  const store = useSidebarState()

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated ? store : { collapsed: false, width: 256, mobileOpen: false, expandedGroups: [] }
}
