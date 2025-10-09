import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { FAQSection } from '@/components/home/FAQSection'

const sample = [
  { question: 'Q1?', answer: 'A1' },
  { question: 'Q2?', answer: 'A2' },
  { question: 'Q3?', answer: 'A3' }
]

describe('FAQSection a11y and keyboard', () => {
  it('renders heading and items with accessible regions and controls', () => {
    const { container, unmount } = render(<FAQSection items={sample} />)
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
      fireEvent.click(btn0)
      expect(btn0.getAttribute('aria-expanded')).toBe('true')
      // Content now visible
      expect(region0.classList.contains('hidden')).toBe(false)
    } finally {
      unmount()
    }
  })

  it('supports arrow key navigation and Home/End keys', () => {
    const { container, unmount } = render(<FAQSection items={sample} />)
    try {
      const btn0 = container.querySelector('#faq-0-content-header') as HTMLElement
      const btn1 = container.querySelector('#faq-1-content-header') as HTMLElement
      const btn2 = container.querySelector('#faq-2-content-header') as HTMLElement

      expect(btn0).toBeTruthy()
      expect(btn1).toBeTruthy()
      expect(btn2).toBeTruthy()

      // Focus btn0 then ArrowDown -> btn1
      btn0.focus()
      fireEvent.keyDown(btn0, { key: 'ArrowDown' })
      expect(document.activeElement).toBe(btn1)

      // ArrowDown from last wraps to first
      btn1.focus()
      fireEvent.keyDown(btn1, { key: 'ArrowDown' })
      expect(document.activeElement).toBe(btn2)

      fireEvent.keyDown(btn2, { key: 'ArrowDown' })
      expect(document.activeElement).toBe(btn0)

      // Home moves to first
      btn2.focus()
      fireEvent.keyDown(btn2, { key: 'Home' })
      expect(document.activeElement).toBe(btn0)

      // End moves to last
      fireEvent.keyDown(btn0, { key: 'End' })
      expect(document.activeElement).toBe(btn2)

      // Enter toggles
      expect(btn2.getAttribute('aria-expanded')).toBe('false')
      fireEvent.keyDown(btn2, { key: 'Enter' })
      expect(btn2.getAttribute('aria-expanded')).toBe('true')
    } finally {
      unmount()
    }
  })
})
