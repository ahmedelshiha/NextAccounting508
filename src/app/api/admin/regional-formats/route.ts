import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import * as Sentry from '@sentry/nextjs'

interface RegionalFormat {
  language: string
  dateFormat: string
  timeFormat: string
  currencyCode: string
  currencySymbol: string
  numberFormat: string
  decimalSeparator: string
  thousandsSeparator: string
}

// Default regional formats for supported languages
const DEFAULT_FORMATS: Record<string, RegionalFormat> = {
  en: {
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:MM AM',
    currencyCode: 'USD',
    currencySymbol: '$',
    numberFormat: '#,##0.00',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  ar: {
    language: 'ar',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'SAR',
    currencySymbol: '﷼',
    numberFormat: '#,##0.00',
    decimalSeparator: '٫',
    thousandsSeparator: '٬',
  },
  hi: {
    language: 'hi',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:MM AM',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '#,##,##0.00',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
}

/**
 * GET /api/admin/regional-formats
 * Fetch all regional format settings
 */
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    // TODO: Fetch from database when regional_formats table is created
    // For now, return defaults
    return NextResponse.json({
      data: DEFAULT_FORMATS,
    })
  } catch (error) {
    console.error('Failed to fetch regional formats:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to fetch regional formats' },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/admin/regional-formats
 * Update regional format settings for a language
 */
export const PUT = withTenantContext(async (request: NextRequest) => {
  try {
    const body = await request.json()

    if (!body.language) {
      return NextResponse.json(
        { error: 'language is required' },
        { status: 400 }
      )
    }

    // TODO: Save to database when regional_formats table is created
    const format: RegionalFormat = {
      language: body.language,
      dateFormat: body.dateFormat || DEFAULT_FORMATS[body.language]?.dateFormat || 'MM/DD/YYYY',
      timeFormat: body.timeFormat || DEFAULT_FORMATS[body.language]?.timeFormat || 'HH:MM AM',
      currencyCode: body.currencyCode || DEFAULT_FORMATS[body.language]?.currencyCode || 'USD',
      currencySymbol: body.currencySymbol || DEFAULT_FORMATS[body.language]?.currencySymbol || '$',
      numberFormat: body.numberFormat || DEFAULT_FORMATS[body.language]?.numberFormat || '#,##0.00',
      decimalSeparator: body.decimalSeparator || DEFAULT_FORMATS[body.language]?.decimalSeparator || '.',
      thousandsSeparator: body.thousandsSeparator || DEFAULT_FORMATS[body.language]?.thousandsSeparator || ',',
    }

    Sentry.addBreadcrumb({
      category: 'localization.formats',
      message: 'Regional format updated',
      level: 'info',
      data: {
        language: body.language,
        currencyCode: format.currencyCode,
      },
    })

    return NextResponse.json({ data: format })
  } catch (error) {
    console.error('Failed to update regional formats:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to update regional formats' },
      { status: 500 }
    )
  }
})
