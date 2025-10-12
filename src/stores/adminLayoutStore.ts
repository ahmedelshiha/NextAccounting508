import { 
  useAdminLayoutSafe,
  useSidebarState as useSidebarStateNew,
  useNavigationState as useNavigationStateNew,
  useUIState as useUIStateNew,
} from '@/stores/admin/layout.store'

export const useSidebarState = useSidebarStateNew

export const useNavigationState = () => {
  const nav = useNavigationStateNew()
  const side = useSidebarStateNew()
  return {
    ...nav,
    expandedGroups: side.expandedGroups,
    toggleGroup: side.toggleGroup,
  }
}

export const useUIState = useUIStateNew

export const useAdminLayout = () => {
  const safe = useAdminLayoutSafe()
  return {
    sidebar: safe.sidebar,
    navigation: safe.navigation,
    ui: safe.ui,
  }
}
