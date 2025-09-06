import type { Decimal } from '@prisma/client/runtime'

export type DecimalLike = Decimal | number | string | null | undefined

/**
 * Safely convert a Prisma Decimal (or number/string) to a JS number.
 * Returns 0 for null/undefined/invalid values.
 */
export function decimalToNumber(value: DecimalLike): number {
  if (value === null || value === undefined) return 0

  // Primitive number
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  // String representation
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }

  // Possible Prisma Decimal or similar object with toNumber()
  const anyVal = value as unknown as { toNumber?: () => number }
  if (anyVal && typeof anyVal.toNumber === 'function') {
    try {
      const n = anyVal.toNumber()
      return Number.isFinite(n) ? n : 0
    } catch (err) {
      console.error('decimalToNumber: failed to convert Decimal with toNumber()', err)
      return 0
    }
  }

  // Fallback: try numeric coercion
  try {
    const n = Number(value as unknown as any)
    return Number.isFinite(n) ? n : 0
  } catch (err) {
    console.error('decimalToNumber: invalid value', value, err)
    return 0
  }
}

/**
 * Sum an array of DecimalLike values, returning a number.
 */
export function sumDecimals(values: DecimalLike[]): number {
  return values.reduce((acc, v) => acc + decimalToNumber(v), 0)
}

/**
 * Format a DecimalLike value as currency string.
 */
export function formatCurrencyFromDecimal(
  value: DecimalLike,
  locale = 'en-US',
  currency = 'USD'
): string {
  const n = decimalToNumber(value)
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n)
}
