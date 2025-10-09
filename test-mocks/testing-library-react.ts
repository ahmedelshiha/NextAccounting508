import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

function decodeHtmlEntities(s: string) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function extractVisibleText(html: string) {
  const raw = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')
  return decodeHtmlEntities(raw.replace(/\s+/g, ' ').trim())
}

function findByTestId(html: string, id: string) {
  const re = new RegExp(`data-testid\\s*=\\s*\"${id}\"|data-testid\\s*=\\s*'${id}'`)
  const match = re.exec(html)
  if (!match) return null
  // crude: extract the nearest tag containing the test id
  const tagRe = new RegExp(`(<[a-zA-Z0-9-\\s\\"'=/:\.\\-\\_\\>]*${match[0]}[\\s\\S]*?>)([\\s\\S]*?)<\\/[^>]+>`, 'i')
  const tagMatch = tagRe.exec(html)
  if (tagMatch) return { html: tagMatch[0], textContent: extractVisibleText(tagMatch[0]) }
  return { html: match[0], textContent: '' }
}

export function render(node: React.ReactElement) {
  try {
    const html = renderToStaticMarkup(node)
    const text = extractVisibleText(html)
    ;(globalThis as any).__renderedHtml = html
    ;(globalThis as any).__renderedTexts = [text]
    const rerender = (newNode: React.ReactElement) => {
      const newHtml = renderToStaticMarkup(newNode)
      ;(globalThis as any).__renderedHtml = newHtml
      ;(globalThis as any).__renderedTexts = [extractVisibleText(newHtml)]
    }
    return { container: html, rerender }
  } catch (e) {
    console.error('RENDER_ERROR:', String(e && (e as any).message) || e)
    ;(globalThis as any).__renderedHtml = ''
    ;(globalThis as any).__renderedTexts = []
    return { container: '', rerender: () => {} }
  }
}

function matchesText(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

export const screen = {
  getByText: (t: string) => {
    const arr: string[] = (globalThis as any).__renderedTexts || []
    const original = arr.join(' ')
    if (matchesText(original, t)) return { textContent: original }
    throw new Error('Text not found: ' + t)
  },
  queryAllByText: (t: string) => {
    const arr: string[] = (globalThis as any).__renderedTexts || []
    const original = arr.join(' ')
    if (matchesText(original, t)) return [{ textContent: original }]
    return []
  },
  queryByTestId: (id: string) => {
    const html: string = (globalThis as any).__renderedHtml || ''
    const found = findByTestId(html, id)
    return found ? { textContent: found.textContent } : null
  },
  getByTestId: (id: string) => {
    const res = (screen as any).queryByTestId(id)
    if (res) return res
    throw new Error('No element found with test id: ' + id)
  },
  queryAllByTextAndReturn: (t: string) => {
    // alias for compatibility
    return (screen as any).queryAllByText(t)
  }
}

export default {
  render,
  screen,
}
