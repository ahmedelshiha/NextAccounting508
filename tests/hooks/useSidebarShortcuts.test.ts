import React from 'react'
/** @vitest-environment jsdom */
import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import useSidebarShortcuts from '@/hooks/admin/useSidebarShortcuts'

function TestHarness({ toggle, setCollapsed }: any) {
  useSidebarShortcuts({ toggleSidebar: toggle, setCollapsed })
  return React.createElement('div')
}

describe('useSidebarShortcuts', () => {
  it('calls toggle on Mod+B and collapse/expand on Mod+[ and Mod+]', () => {
    const toggle = vi.fn()
    const setCollapsed = vi.fn()

    render(React.createElement(TestHarness, { toggle, setCollapsed }))

    // Mod+B
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }))
    expect(toggle).toHaveBeenCalled()

    // Mod+[ -> collapse
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '[', ctrlKey: true }))
    expect(setCollapsed).toHaveBeenCalledWith(true)

    // Mod+] -> expand
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ']', ctrlKey: true }))
    expect(setCollapsed).toHaveBeenCalledWith(false)
  })
})
