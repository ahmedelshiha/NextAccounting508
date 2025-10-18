'use client'

import { useEffect } from 'react'
import { useSidebarActions } from '@/stores/admin/layout.store.selectors'

export function useSidebarKeyboardShortcuts() {
  const { toggleSidebar, setCollapsed } = useSidebarActions()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      try {
        const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
        const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey
        const key = event.key.toLowerCase()

        if (isCtrlOrCmd && key === 'b') {
          event.preventDefault()
          toggleSidebar()
        }

        if (isCtrlOrCmd && key === '[') {
          event.preventDefault()
          setCollapsed(true)
        }

        if (isCtrlOrCmd && key === ']') {
          event.preventDefault()
          setCollapsed(false)
        }
      } catch (e) {}
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSidebar, setCollapsed])
}
