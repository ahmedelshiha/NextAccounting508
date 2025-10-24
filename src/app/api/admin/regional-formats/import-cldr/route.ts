import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { languageCode } = body
    if (!languageCode) return Response.json({ error: 'languageCode is required' }, { status: 400 })

    // Simulate CLDR fetch: return a sensible default mapping
    const cldrSample: Record<string, any> = {
      'en-US': {
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'hh:mm a',
        currencyCode: 'USD',
        currencySymbol: '$',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
      'en-GB': {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currencyCode: 'GBP',
        currencySymbol: '£',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      'ar-AE': {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currencyCode: 'AED',
        currencySymbol: 'د.إ',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
    }

    const found = cldrSample[languageCode] || cldrSample['en-US']

    return Response.json({ success: true, data: { languageCode, ...found } })
  } catch (error: any) {
    console.error('Failed to import CLDR format:', error)
    return Response.json({ error: error.message || 'Failed to import CLDR' }, { status: 500 })
  }
})
