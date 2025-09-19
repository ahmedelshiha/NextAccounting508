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
    // Zod issue formatting (v4 flatten or original issues)
    try {
      const details = anyVal?.error?.details
      // zod .flatten() shape: { formErrors: string[], fieldErrors: Record<string,string[]> }
      if (details) {
        if (Array.isArray(details.issues) && details.issues.length) {
          const first = details.issues[0]
          if (first?.message) return String(first.message)
        }
        if (Array.isArray(details.formErrors) && details.formErrors.length) return String(details.formErrors[0])
        if (details.fieldErrors && typeof details.fieldErrors === 'object') {
          const firstKey = Object.keys(details.fieldErrors)[0]
          const arr = details.fieldErrors[firstKey]
          if (Array.isArray(arr) && arr.length) return String(arr[0])
        }
      }
    } catch {}
    return fallback
  } catch {
    return fallback
  }
}
