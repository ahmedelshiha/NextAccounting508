/**
 * API error response utilities
 * - Provides a typed ApiError class for throwing structured errors inside services/routes
 * - Helpers to normalize errors into a minimal JSON body: { code, message, details? }
 * - Small mappers for common error types (Prisma unique constraint, Zod)
 */

import type { ZodError } from 'zod'

export type ApiErrorBody = {
  code: string
  message: string
  details?: any
}

export class ApiError extends Error {
  public code: string
  public status: number
  public details?: any

  constructor(code: string, message: string, status = 400, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
    // Ensure instanceof works across transpile boundaries
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export function isApiError(err: any): err is ApiError {
  return err && typeof err.code === 'string' && typeof err.message === 'string'
}

export function makeErrorBody(err: unknown): ApiErrorBody {
  if (isApiError(err)) {
    const b: ApiErrorBody = { code: err.code, message: err.message }
    if (err.details !== undefined) b.details = err.details
    return b
  }

  // Zod errors
  if (isZodError(err)) {
    return { code: 'VALIDATION_FAILED', message: 'Validation failed', details: zodErrorToIssues(err) }
  }

  // Prisma unique constraint (P2002) or other known shapes can be normalized by callers via mapPrismaError
  if (err && typeof err === 'object' && (err as any).code && typeof (err as any).code === 'string') {
    return { code: String((err as any).code), message: String((err as any).message || 'Database error'), details: (err as any).meta ?? undefined }
  }

  // Fallback generic error
  const message = (err instanceof Error) ? err.message : 'Internal server error'
  return { code: 'INTERNAL_ERROR', message }
}

export function mapPrismaError(err: any): ApiError | null {
  if (!err || typeof err !== 'object') return null
  // Prisma P2002 => Unique constraint failed
  if (err.code === 'P2002') {
    // meta.target typically includes the column(s) that caused the conflict
    const target = err.meta?.target ?? err.meta?.constraint ?? undefined
    const details = target ? { target } : undefined
    // If the target contains 'slug', map to SLUG_CONFLICT
    const targetStr = Array.isArray(target) ? target.join(',') : String(target ?? '')
    const code = /slug/i.test(targetStr) ? 'SLUG_CONFLICT' : 'UNIQUE_CONSTRAINT'
    return new ApiError(code, 'Unique constraint violation', 409, details)
  }
  return null
}

export function mapZodError(err: ZodError): ApiError {
  return new ApiError('VALIDATION_FAILED', 'Validation failed', 400, zodErrorToIssues(err))
}

function isZodError(err: any): err is ZodError {
  return err && typeof err === 'object' && err.name === 'ZodError'
}

function zodErrorToIssues(err: ZodError) {
  try {
    return err.issues.map(i => ({ path: i.path, message: i.message, code: i.code }))
  } catch {
    return { message: 'Invalid input' }
  }
}

// Export common error codes as constants for reuse
export const ERROR_CODES = {
  SLUG_CONFLICT: 'SLUG_CONFLICT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNIQUE_CONSTRAINT: 'UNIQUE_CONSTRAINT',
} as const
