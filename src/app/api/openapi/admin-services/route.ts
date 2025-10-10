import { NextResponse } from 'next/server'
import spec from '@/openapi/admin-services.json'
import { withTenantContext } from '@/lib/api-wrapper'

export const GET = withTenantContext(async () => NextResponse.json(spec), { requireAuth: false })
