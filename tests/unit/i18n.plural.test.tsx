import { describe, it, expect } from 'vitest'
import { render, screen } from '../..//test-mocks/testing-library-react'
import { TranslationContext } from '@/lib/i18n'

function Test({ k, params, ctx }: any) {
  const mod = require('@/lib/i18n')
  const { useTranslations } = mod
  const { t } = useTranslations()
  return <span data-testid="out">{t(k, params)}</span>
}

describe('pluralization', () => {
  it('selects singular and plural for en', () => {
    const translations = {
      'cart.items.one': '1 item',
      'cart.items.other': '{{count}} items'
    }
    const ctx = { locale: 'en', translations, setLocale: () => {}, currentGender: undefined, setGender: () => {} }
    render(
      <TranslationContext.Provider value={ctx as any}>
        <Test k="cart.items" params={{ count: 1 }} />
      </TranslationContext.Provider>
    )
    expect(screen.getByTestId('out').textContent).toBe('1 item')

    render(
      <TranslationContext.Provider value={ctx as any}>
        <Test k="cart.items" params={{ count: 5 }} />
      </TranslationContext.Provider>
    )
    expect(screen.getByTestId('out').textContent).toBe('5 items')
  })

  it('falls back appropriately when plural variant missing', () => {
    const translations = {
      'cart.items.other': '{{count}} items',
      'cart.items': 'Items'
    }
    const ctx = { locale: 'en', translations, setLocale: () => {}, currentGender: undefined, setGender: () => {} }
    render(
      <TranslationContext.Provider value={ctx as any}>
        <Test k="cart.items" params={{ count: 1 }} />
      </TranslationContext.Provider>
    )
    // plural form for 1 would be 'one' but missing -> falls back to base key
    expect(screen.getByTestId('out').textContent).toBe('Items')
  })

  it('supports simplified arabic plural categories', () => {
    const translations = {
      'msgs.items.one': 'عنصر واحد',
      'msgs.items.other': '{{count}} عناصر'
    }
    const ctx = { locale: 'ar', translations, setLocale: () => {}, currentGender: undefined, setGender: () => {} }
    render(
      <TranslationContext.Provider value={ctx as any}>
        <Test k="msgs.items" params={{ count: 1 }} />
      </TranslationContext.Provider>
    )
    expect(screen.getByTestId('out').textContent).toBe('عنصر واحد')

    render(
      <TranslationContext.Provider value={ctx as any}>
        <Test k="msgs.items" params={{ count: 5 }} />
      </TranslationContext.Provider>
    )
    expect(screen.getByTestId('out').textContent).toBe('5 عناصر')
  })
})
