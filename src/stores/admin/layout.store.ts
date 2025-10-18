import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SidebarState {
  collapsed: boolean
  width: number
  mobileOpen: boolean
  expandedGroups: string[]
}

export interface AdminLayoutStore {
  sidebar: SidebarState
  toggleSidebar: () => void
  setCollapsed: (collapsed: boolean) => void
  setWidth: (width: number) => void
  setMobileOpen: (open: boolean) => void
  toggleGroup: (groupId: string) => void
  setExpandedGroups: (groups: string[]) => void
}

const SIDEBAR_KEYS = {
  WIDTH: 'admin:sidebar:width',
  COLLAPSED: 'admin:sidebar:collapsed',
  EXPANDED: 'admin:sidebar:expanded',
}

function readLegacyStorage() {
  try {
    if (typeof window === 'undefined') return null
    const widthRaw = window.localStorage.getItem(SIDEBAR_KEYS.WIDTH)
    const collapsedRaw = window.localStorage.getItem(SIDEBAR_KEYS.COLLAPSED)
    const expandedRaw = window.localStorage.getItem(SIDEBAR_KEYS.EXPANDED)

    const width = widthRaw ? parseInt(widthRaw, 10) : undefined
    const collapsed = collapsedRaw === '1' || collapsedRaw === 'true'
    const expanded = expandedRaw ? JSON.parse(expandedRaw) : undefined

    return {
      width: Number.isFinite(width) ? width : undefined,
      collapsed: typeof collapsedRaw === 'string' ? collapsed : undefined,
      expanded: Array.isArray(expanded) ? expanded : undefined,
    }
  } catch (e) {
    return null
  }
}

const legacy = typeof window !== 'undefined' ? readLegacyStorage() : null

const DEFAULT_SIDEBAR = {
  collapsed: legacy?.collapsed ?? false,
  width: legacy?.width ?? 256,
  mobileOpen: false,
  expandedGroups: legacy?.expanded ?? ['dashboard', 'business'],
}

export const useAdminLayoutStore = create<AdminLayoutStore>()(
  persist(
    (set, get) => ({
      sidebar: DEFAULT_SIDEBAR,

      toggleSidebar: () =>
        set(state => ({
          sidebar: { ...state.sidebar, collapsed: !state.sidebar.collapsed },
        })),

      setCollapsed: (collapsed: boolean) =>
        set(state => ({ sidebar: { ...state.sidebar, collapsed } })),

      setWidth: (width: number) =>
        set(state => ({ sidebar: { ...state.sidebar, width: Math.min(420, Math.max(160, Math.round(width))) } })),

      setMobileOpen: (open: boolean) =>
        set(state => ({ sidebar: { ...state.sidebar, mobileOpen: open } })),

      toggleGroup: (groupId: string) =>
        set(state => {
          const groups = state.sidebar.expandedGroups
          const index = groups.indexOf(groupId)
          return {
            sidebar: {
              ...state.sidebar,
              expandedGroups: index > -1 ? groups.filter((_, i) => i !== index) : [...groups, groupId],
            },
          }
        }),

      setExpandedGroups: (groups: string[]) =>
        set(state => ({ sidebar: { ...state.sidebar, expandedGroups: groups } })),
    }),
    {
      name: 'admin-layout-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : ({} as Storage))),
      partialize: (state) => ({
        sidebar: {
          collapsed: state.sidebar.collapsed,
          width: state.sidebar.width,
          // Do not persist mobileOpen or expandedGroups by default
        },
      }),
    }
  )
)
