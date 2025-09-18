import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export function render(node: React.ReactElement) {
  try {
    const html = renderToStaticMarkup(node)
    // crude extraction of visible text
    const text = html.replace(/<[^>]+>/g, ' ')
    const parts = text.split(/\s+/).map(p => p.trim()).filter(Boolean)
    ;(globalThis as any).__renderedTexts = parts
    return { container: html }
  } catch (e) {
    ;(globalThis as any).__renderedTexts = []
    return { container: '' }
  }
}

export const screen = {
  getByText: (t: string) => {
    const arr: string[] = (globalThis as any).__renderedTexts || []
    const found = arr.find(x => x === t || x.includes(t))
    if (!found) throw new Error('Text not found: ' + t)
    return { textContent: found }
  }
}
