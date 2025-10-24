import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test-mocks/testing-library-react'
import { TranslationContext } from '@/lib/i18n'
import enNested from '@/app/locales/en.json'
import hiNested from '@/app/locales/hi.json'
import arNested from '@/app/locales/ar.json'
import { flattenTranslations } from '@/lib/translation-utils'

function TestComponent({ k, params }: { k: string; params?: Record<string, any> }) {
  const mod = require('@/lib/i18n')
  const { useTranslations } = mod
  const { t } = useTranslations()
  return <span data-testid="out">{t(k, params)}</span>
}

describe('gender-aware translations', () => {
  it('ignores gender for English (no variants)', () => {
    const flat = flattenTranslations(enNested as any)
    const ctx = { locale: 'en', translations: flat, setLocale: () => {}, currentGender: undefined, setGender: () => {} }
    render(
      <TranslationContext.Provider value={ctx as any}>
        <TestComponent k="greeting.welcome" params={{ name: 'Alex', gender: 'male' }} />
      </TranslationContext.Provider>
    )
    expect(screen.getByTestId('out').textContent).toContain('Welcome')
  })

  it('selects female variant for Hindi when available', () => {
    const flat = flattenTranslations(hiNested as any)
    const ctx = { locale: 'hi', translations: flat, setLocale: () => {}, currentGender: undefined, setGender: () => {} }
    render(
      <TranslationContext.Provider value={ctx as any}>
        <TestComponent k="greeting.welcome" params={{ name: 'अनिता', gender: 'female' }} />
      </TranslationContext.Provider>
    )
    expect(screen.getByTestId('out').textContent).toMatch(/श्रीमती/) // expects female honorific
  })

  it('falls back to base key when gender-specific missing (Arabic example)', () => {
    const flat = flattenTranslations(arNested as any)
    const ctx = { locale: 'ar', translations: flat, setLocale: () => {}, currentGender: undefined, setGender: () => {} }
    render(
      <TranslationContext.Provider value={ctx as any}>
        <TestComponent k="greeting.welcome" params={{ name: 'سارة', gender: 'female' }} />
      </TranslationContext.Provider>
    )
    // If ar.json lacks greeting.welcome.female, it should return base greeting
    expect(screen.getByTestId('out').textContent).toContain('أهلا')
  })
})
