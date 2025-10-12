import { useAdminLayoutSafe } from '@/stores/admin/layout.store'

// Backwards-compatible wrapper used by legacy imports
export function useAdminLayoutStoreSSRSafe() {
  const safe = useAdminLayoutSafe()
  return {
    sidebarCollapsed: safe.sidebar.collapsed,
    setSidebarCollapsed: (v: boolean) => safe.sidebar.setCollapsed(v),
    sidebarOpen: safe.sidebar.open,
    setSidebarOpen: (v: boolean) => safe.sidebar.setOpen(v),
  }
}

export default useAdminLayoutStoreSSRSafe
