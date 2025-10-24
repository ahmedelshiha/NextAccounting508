import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test-mocks/testing-library-react'
import enNested from '@/app/locales/en.json'
import hiNested from '@/app/locales/hi.json'
import { flattenTranslations } from '@/lib/translation-utils'
import { TranslationContext, defaultLocale } from '@/lib/i18n'

function TestComponent({ k, params }: { k: string; params?: Record<string, any> }) {
  const mod = require('@/lib/i18n')
  const { useTranslations } = mod
  const { t } = useTranslations()
  return (
    <div>
      <span data-testid="out">{t(k, params)}</span>
    </div>
  )
}

describe('i18n namespace access', () => {
  it('flattens nested namespaces and resolves dot-notation keys', () => {
    const flat = flattenTranslations({
      nav: { home: 'Home', about: 'About' },
      greeting: { welcome: 'Welcome' },
    } as any)
    expect(flat['nav.home']).toBe('Home')
    expect(flat['nav.about']).toBe('About')
    expect(flat['greeting.welcome']).toBe('Welcome')
  })

  it('resolves nested keys from en locale', () => {
    const flat = flattenTranslations(enNested as any)
    const ctx = {
      locale: defaultLocale,
      translations: flat,
      setLocale: () => {},
      currentGender: undefined,
      setGender: () => {},
    }
    render(
      <TranslationContext.Provider value={ctx as any}>
        <TestComponent k="nav.home" />
      </TranslationContext.Provider>
    )
    expect(screen.getByTestId('out').textContent).toContain('Home')
  })

  it('resolves nested keys and gender variants from hi locale', () => {
    const flat = flattenTranslations(hiNested as any)
    const ctx = {
      locale: 'hi',
      translations: flat,
      setLocale: () => {},
      currentGender: 'female',
      setGender: () => {},
    }
    render(
      <TranslationContext.Provider value={ctx as any}>
        <TestComponent k="nav.home" />
        <TestComponent k="greeting.welcome" params={{ name: 'अनिता' }} />
      </TranslationContext.Provider>
    )
    expect(screen.getByText('होम').textContent).toContain('होम')
    expect(screen.getByText(/श्रीमती/).textContent).toMatch(/श्रीमती/)
  })

  it('falls back to base key when gender variant missing', () => {
    const flat = flattenTranslations(hiNested as any)
    const ctx = {
      locale: 'hi',
      translations: flat,
      setLocale: () => {},
      currentGender: 'neuter',
      setGender: () => {},
    }
    render(
      <TranslationContext.Provider value={ctx as any}>
        <TestComponent k="email.greeting" params={{ name: 'अनिता' }} />
      </TranslationContext.Provider>
    )
    expect(screen.getByText('नमस्ते').textContent).toContain('नमस्ते')
  })
})
