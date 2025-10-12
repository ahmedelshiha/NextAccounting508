import { useEffect } from 'react'

interface SidebarShortcutsArgs {
  toggleSidebar: () => void
  setCollapsed: (collapsed: boolean) => void
}

// Lightweight cross-platform keyboard shortcuts for sidebar without extra deps.
export function useSidebarShortcuts({ toggleSidebar, setCollapsed }: SidebarShortcutsArgs) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      // Toggle sidebar: Mod+B
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleSidebar()
        return
      }

      // Collapse: Mod+[  (left bracket)
      if (e.key === '[') {
        e.preventDefault()
        setCollapsed(true)
        return
      }

      // Expand: Mod+]  (right bracket)
      if (e.key === ']') {
        e.preventDefault()
        setCollapsed(false)
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSidebar, setCollapsed])
}

export default useSidebarShortcuts
