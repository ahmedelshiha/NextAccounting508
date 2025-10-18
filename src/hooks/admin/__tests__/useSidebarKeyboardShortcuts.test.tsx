import { renderHook, act } from '@testing-library/react'
import { useSidebarKeyboardShortcuts } from '../useSidebarKeyboardShortcuts'
import { useAdminLayoutStore } from '@/stores/admin/layout.store'

describe('useSidebarKeyboardShortcuts', () => {
  beforeEach(() => {
    useAdminLayoutStore.setState({
      sidebar: { collapsed: false, width: 256, mobileOpen: false, expandedGroups: [] }
    })
  })

  it('toggles sidebar on Ctrl/Cmd+B', () => {
    renderHook(() => useSidebarKeyboardShortcuts())

    act(() => {
      const evt = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true })
      window.dispatchEvent(evt)
    })

    const state = useAdminLayoutStore.getState()
    expect(state.sidebar.collapsed).toBe(true)

    act(() => {
      const evt = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true })
      window.dispatchEvent(evt)
    })

    expect(useAdminLayoutStore.getState().sidebar.collapsed).toBe(false)
  })

  it('collapses with Ctrl/Cmd+[ and expands with Ctrl/Cmd+]', () => {
    renderHook(() => useSidebarKeyboardShortcuts())

    act(() => {
      const evt = new KeyboardEvent('keydown', { key: '[', ctrlKey: true })
      window.dispatchEvent(evt)
    })
    expect(useAdminLayoutStore.getState().sidebar.collapsed).toBe(true)

    act(() => {
      const evt = new KeyboardEvent('keydown', { key: ']', ctrlKey: true })
      window.dispatchEvent(evt)
    })
    expect(useAdminLayoutStore.getState().sidebar.collapsed).toBe(false)
  })
})
