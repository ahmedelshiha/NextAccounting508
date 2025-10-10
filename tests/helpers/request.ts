import { NextRequest } from 'next/server'

export function createTestRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    tenantId?: string
    userId?: string
    cookies?: Record<string, string>
  } = {}
): NextRequest {
  const {
    method = 'GET',
    body,
    headers = {},
    tenantId = 'test-tenant',
    userId = 'test-user',
    cookies = {},
  } = options

  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    'x-user-id': userId,
    ...headers,
  })

  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    requestHeaders.set('Cookie', cookieString)
  }

  const request = new NextRequest(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest

  return request
}

export async function callRoute(
  handler: (req: NextRequest, params?: any) => Promise<Response>,
  request: NextRequest,
  params?: any
) {
  const response = await handler(request as any, params as any)
  let data: any = null
  try {
    data = await (response as any).json()
  } catch {
    data = null
  }
  return {
    status: (response as any).status,
    data,
    headers: (response as any).headers as Headers,
  }
}
