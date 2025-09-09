export type CurrencyCode = 'USD' | 'SAR' | 'AED' | 'EGP'

export const SUPPORTED_CURRENCIES: { code: CurrencyCode; symbol: string; locale: string; label: string }[] = [
  { code: 'USD', symbol: '$', locale: 'en-US', label: 'USD – US Dollar' },
  { code: 'SAR', symbol: '﷼', locale: 'ar-SA', label: 'SAR – Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', locale: 'ar-AE', label: 'AED – UAE Dirham' },
  { code: 'EGP', symbol: '£', locale: 'ar-EG', label: 'EGP – Egyptian Pound' }
]

// Static rates can be replaced by an API later; base is USD
const BASE = 'USD'
const DEFAULT_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  SAR: 3.75,
  AED: 3.67,
  EGP: 49
}

export function getRate(to: CurrencyCode, rates: Partial<Record<CurrencyCode, number>> = {}): number {
  const merged = { ...DEFAULT_RATES, ...rates }
  return merged[to] || 1
}

export function convertFromUSD(amountUSD: number, to: CurrencyCode, rates?: Partial<Record<CurrencyCode, number>>): number {
  const rate = getRate(to, rates)
  return amountUSD * rate
}

export function formatMoney(value: number, currency: CurrencyCode): string {
  const cfg = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0]
  return new Intl.NumberFormat(cfg.locale, { style: 'currency', currency }).format(value)
}
