// src/hooks/useRovingTabIndex.ts
// Simple roving tabindex style keyboard navigation helper.
// Attaches to a container element and listens for ArrowUp/ArrowDown/Home/End keys
// to move focus between elements marked with the `data-roving` attribute.

import { useCallback, useRef } from 'react'

export default function useRovingTabIndex() {
  const containerRef = useRef<HTMLElement | null>(null)

  const setContainer = useCallback((el: HTMLElement | null) => {
    containerRef.current = el
  }, [])

  const focusItemAt = (index: number) => {
    const el = containerRef.current
    if (!el) return
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-roving]'))
    if (items.length === 0) return
    const safeIndex = Math.max(0, Math.min(index, items.length - 1))
    const target = items[safeIndex]
    if (target && typeof target.focus === 'function') target.focus()
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const el = containerRef.current
    if (!el) return

    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-roving]'))
    if (items.length === 0) return

    const active = document.activeElement as HTMLElement | null
    const currentIndex = active ? items.indexOf(active) : -1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        focusItemAt(currentIndex + 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        focusItemAt(currentIndex - 1)
        break
      case 'Home':
        e.preventDefault()
        focusItemAt(0)
        break
      case 'End':
        e.preventDefault()
        focusItemAt(items.length - 1)
        break
      default:
        break
    }
  }, [])

  return { setContainer, handleKeyDown }
}
