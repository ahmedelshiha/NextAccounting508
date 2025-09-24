import React from 'react'
import { createRoot, Root } from 'react-dom/client'

export type RenderResult = {
  container: HTMLElement
  root: Root
  unmount: () => void
  getByText: (text: string | RegExp) => HTMLElement
}

/**
 * Render a React element into a real DOM container (jsdom).
 * Returns helpers for basic queries and unmounting.
 */
export function renderDOM(node: React.ReactElement): RenderResult {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  root.render(node)

  const getByText = (text: string | RegExp) => {
    const matcher = typeof text === 'string' ? new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : text
    const walk = (el: Element): HTMLElement | null => {
      for (const child of Array.from(el.children)) {
        const c = child as HTMLElement
        if (matcher.test(c.textContent || '')) return c
        const found = walk(c)
        if (found) return found
      }
      return null
    }
    const found = walk(container)
    if (!found) throw new Error('Text not found: ' + String(text))
    return found
  }

  const unmount = () => {
    try { root.unmount() } catch {}
    if (container.parentNode) container.parentNode.removeChild(container)
  }

  return { container, root, unmount, getByText }
}

export const fire = {
  click: (el: Element) => (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })),
  change: (el: Element, value: any) => {
    const input = el as HTMLInputElement
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
}
