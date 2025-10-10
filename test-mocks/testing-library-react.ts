import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

function decodeHtmlEntities(s: string) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function extractVisibleText(html: string) {
  const raw = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')
  return decodeHtmlEntities(raw.replace(/\s+/g, ' ').trim())
}

function findElementByTestId(html: string, id: string) {
  const re = new RegExp(`data-testid\\s*=\\s*"${id}"|data-testid\\s*=\\s*'${id}'`)
  const match = re.exec(html)
  if (!match) return null
  const idx = match.index
  const before = html.lastIndexOf('<', idx)
  const after = html.indexOf('>', idx)
  if (before !== -1 && after !== -1) {
    const tagStart = before
    const closing = html.indexOf('</', after)
    if (closing !== -1) {
      const tagHtml = html.substring(tagStart, closing + 4)
      return { html: tagHtml, textContent: extractVisibleText(tagHtml) }
    }
  }
  return { html: match[0], textContent: '' }
}

function render(node: React.ReactElement) {
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

function extractTagAtIndex(html: string, idx: number) {
  const start = html.lastIndexOf('<', idx)
  if (start === -1) return null
  const m = html.substring(start).match(/^<([a-zA-Z0-9-]+)/)
  if (!m) return null
  const tagName = m[1]
  const close = html.indexOf(`</${tagName}>`, start)
  if (close === -1) return html.substring(start)
  return html.substring(start, close + tagName.length + 3)
}

// Synchronous screen helpers
const screen = {
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
    const found = findElementByTestId(html, id)
    return found ? { textContent: found.textContent } : null
  },
  getByTestId: (id: string) => {
    const res = (screen as any).queryByTestId(id)
    if (res) return res
    throw new Error('No element found with test id: ' + id)
  },
  queryAllByTextAndReturn: (t: string) => {
    return (screen as any).queryAllByText(t)
  },
  queryByRole: (role: string, options?: { name?: RegExp | string, hidden?: boolean }) => {
    const html: string = (globalThis as any).__renderedHtml || ''
    if (!html) return null

    const idx = html.search(new RegExp(`role\\s*=\\s*['"]${role}['"]`, 'i'))
    if (idx !== -1) {
      const tagHtml = extractTagAtIndex(html, idx)
      if (!tagHtml) return null
      const text = extractVisibleText(tagHtml)
      if (!options || !options.name) return { textContent: text }
      const name = options.name
      const nameStr = typeof name === 'string' ? name : name.source
      if (new RegExp(nameStr, 'i').test(text)) return { textContent: text }
    }

    const tagMap: Record<string, string> = {
      navigation: 'nav',
      main: 'main',
      contentinfo: 'footer',
      link: 'a',
      button: 'button',
    }
    const tag = tagMap[role]
    if (tag) {
      const tagIdx = html.search(new RegExp(`<${tag}([\\s>])`, 'i'))
      if (tagIdx !== -1) {
        const tagHtml = extractTagAtIndex(html, tagIdx)
        if (tagHtml) {
          const text = extractVisibleText(tagHtml)
          if (!options || !options.name) return { textContent: text }
          const name = options.name
          const nameStr = typeof name === 'string' ? name : name.source
          if (new RegExp(nameStr, 'i').test(text)) return { textContent: text }
        }
      }
    }

    const ariaIdx = html.search(/aria-label\s*=\s*['"]([^'\"]+)['"]/i)
    if (ariaIdx !== -1) {
      const ariaMatch = html.match(/aria-label\s*=\s*['"]([^'\"]+)['"]/i)
      const ariaVal = ariaMatch ? ariaMatch[1] : ''
      const tagHtml = extractTagAtIndex(html, ariaIdx)
      const text = tagHtml ? extractVisibleText(tagHtml) : ''
      if (!options || !options.name) return { textContent: text }
      const name = options.name
      const nameStr = typeof name === 'string' ? name : name.source
      if (new RegExp(nameStr, 'i').test(ariaVal) || new RegExp(nameStr, 'i').test(text)) return { textContent: text }
    }

    return null
  },
  getByRole: (role: string, options?: { name?: RegExp | string, hidden?: boolean }) => {
    const res = (screen as any).queryByRole(role, options)
    if (res) return res
    throw new Error('No element found with role: ' + role)
  },
  getByLabelText: (label: string) => {
    const html: string = (globalThis as any).__renderedHtml || ''
    if (!html) throw new Error('No rendered HTML')

    const labelIdx = html.search(new RegExp(`<label[^>]*>([\\s\\S]*?)<\\/label>`, 'i'))
    if (labelIdx !== -1) {
      const labelMatches = html.match(/<label[^>]*>([\s\S]*?)<\/label>/gi)
      if (labelMatches) {
        for (const lblHtml of labelMatches) {
          const lblText = extractVisibleText(lblHtml)
          if (new RegExp(label, 'i').test(lblText)) {
            const forMatch = lblHtml.match(/for\s*=\s*['"]([^'\"]+)['"]/i)
            if (forMatch) {
              const id = forMatch[1]
              const inputRe = new RegExp(`<([a-zA-Z0-9]+)([^>]*)id\\s*=\\s*['"]${id}['"]([^>]*)>([\\s\\S]*?)<\\/\\1>`, 'i')
              const inputMatch = html.match(inputRe)
              if (inputMatch) return { textContent: extractVisibleText(inputMatch[0]) }
            }
            const inputInside = lblHtml.match(/<input[^>]*>/i)
            if (inputInside) return { textContent: '' }
          }
        }
      }
    }

    const ariaInputRe = new RegExp(`<([a-zA-Z0-9]+)([^>]*)aria-label\\s*=\\s*['\"]([^'\"]+)['\"]([^>]*)>`, 'i')
    const ariaMatch = html.match(ariaInputRe)
    if (ariaMatch && new RegExp(label, 'i').test(ariaMatch[3])) return { textContent: '' }

    throw new Error('No element found for label: ' + label)
  }
}

// Async helpers that delegate to the synchronous screen
async function findByText(t: string | RegExp, timeout = 50) {
  return new Promise((resolve, reject) => {
    try {
      const res = (screen as any).getByText(t as any)
      resolve(res)
    } catch (e) {
      setTimeout(() => {
        try {
          const r = (screen as any).getByText(t as any)
          resolve(r)
        } catch (err) {
          reject(err)
        }
      }, 0)
    }
  })
}

async function findByRole(role: string, options?: any) {
  return new Promise((resolve, reject) => {
    try {
      const res = (screen as any).getByRole(role, options)
      resolve(res)
    } catch (e) {
      setTimeout(() => {
        try {
          const r = (screen as any).getByRole(role, options)
          resolve(r)
        } catch (err) {
          reject(err)
        }
      }, 0)
    }
  })
}

async function findByTestId(id: string) {
  return new Promise((resolve, reject) => {
    try {
      const res = (screen as any).getByTestId(id)
      resolve(res)
    } catch (e) {
      setTimeout(() => {
        try {
          const r = (screen as any).getByTestId(id)
          resolve(r)
        } catch (err) {
          reject(err)
        }
      }, 0)
    }
  })
}

// Attach async helpers to screen for convenience
;(screen as any).findByText = findByText
;(screen as any).findByRole = findByRole
;(screen as any).findByTestId = findByTestId

const testingLibraryMock = {
  render,
  screen,
}

export { render, screen }
export default testingLibraryMock
