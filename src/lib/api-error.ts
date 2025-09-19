// Small helper to standardize API error messages across the app
// Understands our { success, error: { code, message, details } } shape and common variations.
export function getApiErrorMessage(input: unknown, fallback = 'Request failed'): string {
  try {
    const anyVal: any = input as any
    if (!anyVal) return fallback
    if (typeof anyVal === 'string') return anyVal
    if (anyVal?.error?.message && typeof anyVal.error.message === 'string') return anyVal.error.message
    if (typeof anyVal?.error === 'string') return anyVal.error
    if (typeof anyVal?.message === 'string') return anyVal.message
    // Zod issue formatting
    if (anyVal?.error?.details?.issues && Array.isArray(anyVal.error.details.issues)) {
      const first = anyVal.error.details.issues[0]
      if (first?.message) return String(first.message)
    }
    return fallback
  } catch {
    return fallback
  }
}
