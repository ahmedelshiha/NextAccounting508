import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

function validateFormat(payload: any) {
  const errors: string[] = []
  if (!payload) {
    errors.push('No payload provided')
    return errors
  }
  if (!payload.language) errors.push('language is required')
  if (!payload.dateFormat) errors.push('dateFormat is required')
  if (!payload.timeFormat) errors.push('timeFormat is required')
  if (!payload.currencyCode) errors.push('currencyCode is required')
  if (!payload.currencySymbol) errors.push('currencySymbol is required')
  if (payload.decimalSeparator && payload.decimalSeparator.length !== 1) errors.push('decimalSeparator must be a single character')
  if (payload.thousandsSeparator && payload.thousandsSeparator.length !== 1) errors.push('thousandsSeparator must be a single character')
  return errors
}

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const errors = validateFormat(body)
    if (errors.length > 0) {
      return Response.json({ success: false, errors }, { status: 400 })
    }

    // Basic validation passed
    return Response.json({ success: true, data: { valid: true } })
  } catch (error: any) {
    console.error('Failed to validate regional format:', error)
    return Response.json({ error: error.message || 'Failed to validate format' }, { status: 500 })
  }
})
