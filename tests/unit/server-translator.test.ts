import { describe, it, expect } from 'vitest'
import { createServerTranslator } from '@/lib/server/server-translator'

describe('server-translator', () => {
  it('resolves base keys and substitutes params', () => {
    const translations = { 'greeting.hello': 'Hello, {{name}}' }
    const { t } = createServerTranslator('en' as any, translations as any)
    expect(t('greeting.hello', { name: 'Alice' })).toBe('Hello, Alice')
  })

  it('selects gender variant when available', () => {
    const translations = {
      'greeting.welcome': 'Welcome',
      'greeting.welcome.female': 'Welcome, Ms {{name}}'
    }
    const { t } = createServerTranslator('hi' as any, translations as any)
    expect(t('greeting.welcome', { name: 'Anita', gender: 'female' })).toBe('Welcome, Ms Anita')
  })

  it('selects plural forms correctly', () => {
    const translations = {
      'cart.items.one': '1 item',
      'cart.items.other': '{{count}} items'
    }
    const { t } = createServerTranslator('en' as any, translations as any)
    expect(t('cart.items', { count: 1 })).toBe('1 item')
    expect(t('cart.items', { count: 3 })).toBe('3 items')
  })

  it('falls back to base when plural variant missing', () => {
    const translations = { 'cart.items': 'Items' }
    const { t } = createServerTranslator('en' as any, translations as any)
    expect(t('cart.items', { count: 1 })).toBe('Items')
  })
})
