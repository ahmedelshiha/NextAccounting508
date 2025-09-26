import { describe, it, expect } from 'vitest'
import { renderDOM, fire } from '../../test-mocks/dom'
import { FAQSection } from '@/components/home/FAQSection'

const sample = [
  { question: 'Q1?', answer: 'A1' },
  { question: 'Q2?', answer: 'A2' },
  { question: 'Q3?', answer: 'A3' }
]

describe('FAQSection a11y and keyboard', () => {
  it('renders heading and items with accessible regions and controls', () => {
    const { container, unmount, getByText } = renderDOM(<FAQSection items={sample} />)
    try {
      // Heading present
      const heading = container.querySelector('#faq-section-heading')
      expect(heading).toBeTruthy()

      // Items rendered as buttons with aria-controls
      const btn0 = container.querySelector('#faq-0-content-header') as HTMLElement
      const btn1 = container.querySelector('#faq-1-content-header') as HTMLElement
      expect(btn0).toBeTruthy()
      expect(btn1).toBeTruthy()

      // Regions hidden by default
      const region0 = container.querySelector('#faq-0-content') as HTMLElement
      expect(region0).toBeTruthy()
      expect(region0.classList.contains('hidden') || region0.getAttribute('aria-hidden') === 'true').toBe(true)

      // Toggling by click updates aria-expanded
      expect(btn0.getAttribute('aria-expanded')).toBe('false')
      fire.click(btn0)
      expect(btn0.getAttribute('aria-expanded')).toBe('true')
      // Content now visible
      expect(region0.classList.contains('hidden')).toBe(false)
    } finally {
      unmount()
    }
  })

  it('supports arrow key navigation and Home/End keys', () => {
    const { container, unmount } = renderDOM(<FAQSection items={sample} />)
    try {
      const btn0 = container.querySelector('#faq-0-content-header') as HTMLElement
      const btn1 = container.querySelector('#faq-1-content-header') as HTMLElement
      const btn2 = container.querySelector('#faq-2-content-header') as HTMLElement

      expect(btn0).toBeTruthy()
      expect(btn1).toBeTruthy()
      expect(btn2).toBeTruthy()

      // Focus btn0 then ArrowDown -> btn1
      btn0.focus()
      const down = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      btn0.dispatchEvent(down)
      expect(document.activeElement).toBe(btn1)

      // ArrowDown from last wraps to first
      btn1.focus()
      const down2 = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      btn1.dispatchEvent(down2)
      expect(document.activeElement).toBe(btn2)

      const down3 = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      btn2.dispatchEvent(down3)
      expect(document.activeElement).toBe(btn0)

      // Home moves to first
      btn2.focus()
      const home = new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
      btn2.dispatchEvent(home)
      expect(document.activeElement).toBe(btn0)

      // End moves to last
      const end = new KeyboardEvent('keydown', { key: 'End', bubbles: true })
      btn0.dispatchEvent(end)
      expect(document.activeElement).toBe(btn2)

      // Enter toggles
      expect(btn2.getAttribute('aria-expanded')).toBe('false')
      const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      btn2.dispatchEvent(enter)
      expect(btn2.getAttribute('aria-expanded')).toBe('true')
    } finally {
      unmount()
    }
  })
})
