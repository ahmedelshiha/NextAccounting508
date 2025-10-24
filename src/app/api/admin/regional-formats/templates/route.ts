import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = [
      {
        code: 'en-US',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'hh:mm a',
        currencyCode: 'USD',
        currencySymbol: '$',
        numberFormat: '#,##0.00',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
      {
        code: 'en-GB',
        language: 'en',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currencyCode: 'GBP',
        currencySymbol: '£',
        numberFormat: '#.##0,00',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      {
        code: 'ar-AE',
        language: 'ar',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currencyCode: 'AED',
        currencySymbol: 'د.إ',
        numberFormat: '#,##0.00',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
    ]

    return Response.json({ success: true, data: templates })
  } catch (error: any) {
    console.error('Failed to get regional templates:', error)
    return Response.json({ error: error.message || 'Failed to get templates' }, { status: 500 })
  }
})
