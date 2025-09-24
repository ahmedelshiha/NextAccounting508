import { NextResponse } from 'next/server'

export type ApiSuccess<T = unknown> = {
  success: true
  data: T
  [key: string]: unknown
}

export type ApiError = {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

function json<T = unknown>(body: ApiSuccess<T> | ApiError, init?: number | ResponseInit) {
  const status = typeof init === 'number' ? init : (init as ResponseInit | undefined)?.status
  return NextResponse.json(body as any, typeof init === 'number' ? { status: init } : init)
}

export const respond = {
  ok<T = unknown>(data: T, meta?: Record<string, unknown>) {
    const body: ApiSuccess<T> = { success: true, data, ...(meta || {}) }
    return json(body, 200)
  },
  created<T = unknown>(data: T, meta?: Record<string, unknown>) {
    const body: ApiSuccess<T> = { success: true, data, ...(meta || {}) }
    return json(body, 201)
  },
  badRequest(message = 'Invalid request', details?: unknown) {
    const body: ApiError = { success: false, error: { code: 'BAD_REQUEST', message, details } }
    return json(body, 400)
  },
  unauthorized(message = 'Unauthorized') {
    const body: ApiError = { success: false, error: { code: 'UNAUTHORIZED', message } }
    return json(body, 401)
  },
  forbidden(message = 'Forbidden') {
    const body: ApiError = { success: false, error: { code: 'FORBIDDEN', message } }
    return json(body, 403)
  },
  notFound(message = 'Not Found') {
    const body: ApiError = { success: false, error: { code: 'NOT_FOUND', message } }
    return json(body, 404)
  },
  conflict(message = 'Conflict', details?: unknown) {
    const body: ApiError = { success: false, error: { code: 'CONFLICT', message, details } }
    return json(body, 409)
  },
  tooMany(message = 'Too many requests') {
    const body: ApiError = { success: false, error: { code: 'TOO_MANY_REQUESTS', message } }
    return json(body, 429)
  },
  serverError(message = 'Internal server error', details?: unknown) {
    const body: ApiError = { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message, details } }
    return json(body, 500)
  },
  methodNotAllowed(allow: string) {
    const body: ApiError = { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } }
    return json(body, { status: 405, headers: { Allow: allow } })
  },
}

export function zodDetails(error: unknown): unknown {
  const maybe: any = error as any
  if (maybe && typeof maybe === 'object' && typeof maybe.flatten === 'function') {
    try { return maybe.flatten() } catch { return undefined }
  }
  return undefined
}
