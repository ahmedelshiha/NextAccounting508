import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export function render(node: React.ReactElement) {
  try {
    const html = renderToStaticMarkup(node)
    // crude extraction of visible text — keep full text so tests can match multi-word phrases
    const raw = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    // Basic HTML entity decode for common entities used in components
    const text = raw.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    console.log('RENDERED_DECODED:', text)
    ;(globalThis as any).__renderedTexts = [text]
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
