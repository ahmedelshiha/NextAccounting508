import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { prisma } from '@/lib/prisma'
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
  es: {
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '#.##0,00',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  fr: {
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '#.##0,00',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  de: {
    language: 'de',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '#.##0,00',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  pt: {
    language: 'pt',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'BRL',
    currencySymbol: 'R$',
    numberFormat: '#.##0,00',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  it: {
    language: 'it',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '#.##0,00',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  nl: {
    language: 'nl',
    dateFormat: 'DD-MM-YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '#.##0,00',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  ja: {
    language: 'ja',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:MM',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    numberFormat: '#,##0',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  zh: {
    language: 'zh',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:MM',
    currencyCode: 'CNY',
    currencySymbol: '¥',
    numberFormat: '#,##0.00',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  ko: {
    language: 'ko',
    dateFormat: 'YYYY.MM.DD',
    timeFormat: 'HH:MM',
    currencyCode: 'KRW',
    currencySymbol: '₩',
    numberFormat: '#,##0',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  ru: {
    language: 'ru',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'RUB',
    currencySymbol: '₽',
    numberFormat: '#.##0,00',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  pl: {
    language: 'pl',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'PLN',
    currencySymbol: 'zł',
    numberFormat: '#.##0,00',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  th: {
    language: 'th',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'THB',
    currencySymbol: '฿',
    numberFormat: '#,##0.00',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  vi: {
    language: 'vi',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:MM',
    currencyCode: 'VND',
    currencySymbol: '₫',
    numberFormat: '#.##0',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
}

/**
 * GET /api/admin/regional-formats
 * Fetch all regional format settings
 */
export const GET = withTenantContext(async (request: NextRequest, context: any) => {
  try {
    const tenantId = context.tenantId

    const formats = await prisma.regionalFormat.findMany({
      where: { tenantId },
    })

    const result: Record<string, RegionalFormat> = {}

    for (const format of formats) {
      result[format.languageCode] = {
        language: format.languageCode,
        dateFormat: format.dateFormat,
        timeFormat: format.timeFormat,
        currencyCode: format.currencyCode,
        currencySymbol: format.currencySymbol,
        numberFormat: format.numberFormat,
        decimalSeparator: format.decimalSeparator,
        thousandsSeparator: format.thousandsSeparator,
      }
    }

    // Fill in defaults for languages not in database
    for (const [code, defaultFormat] of Object.entries(DEFAULT_FORMATS)) {
      if (!result[code]) {
        result[code] = defaultFormat
      }
    }

    return NextResponse.json({
      data: result,
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
export const PUT = withTenantContext(async (request: NextRequest, context: any) => {
  try {
    const tenantId = context.tenantId
    const body = await request.json()

    if (!body.language) {
      return NextResponse.json(
        { error: 'language is required' },
        { status: 400 }
      )
    }

    const format = await prisma.regionalFormat.upsert({
      where: {
        tenantId_languageCode: {
          tenantId,
          languageCode: body.language,
        },
      },
      create: {
        tenantId,
        languageCode: body.language,
        dateFormat: body.dateFormat || DEFAULT_FORMATS[body.language]?.dateFormat || 'MM/DD/YYYY',
        timeFormat: body.timeFormat || DEFAULT_FORMATS[body.language]?.timeFormat || 'HH:MM AM',
        currencyCode: body.currencyCode || DEFAULT_FORMATS[body.language]?.currencyCode || 'USD',
        currencySymbol: body.currencySymbol || DEFAULT_FORMATS[body.language]?.currencySymbol || '$',
        numberFormat: body.numberFormat || DEFAULT_FORMATS[body.language]?.numberFormat || '#,##0.00',
        decimalSeparator: body.decimalSeparator || DEFAULT_FORMATS[body.language]?.decimalSeparator || '.',
        thousandsSeparator: body.thousandsSeparator || DEFAULT_FORMATS[body.language]?.thousandsSeparator || ',',
      },
      update: {
        dateFormat: body.dateFormat || DEFAULT_FORMATS[body.language]?.dateFormat || 'MM/DD/YYYY',
        timeFormat: body.timeFormat || DEFAULT_FORMATS[body.language]?.timeFormat || 'HH:MM AM',
        currencyCode: body.currencyCode || DEFAULT_FORMATS[body.language]?.currencyCode || 'USD',
        currencySymbol: body.currencySymbol || DEFAULT_FORMATS[body.language]?.currencySymbol || '$',
        numberFormat: body.numberFormat || DEFAULT_FORMATS[body.language]?.numberFormat || '#,##0.00',
        decimalSeparator: body.decimalSeparator || DEFAULT_FORMATS[body.language]?.decimalSeparator || '.',
        thousandsSeparator: body.thousandsSeparator || DEFAULT_FORMATS[body.language]?.thousandsSeparator || ',',
      },
    })

    Sentry.addBreadcrumb({
      category: 'localization.formats',
      message: 'Regional format updated',
      level: 'info',
      data: {
        language: body.language,
        currencyCode: format.currencyCode,
      },
    })

    const response: RegionalFormat = {
      language: format.languageCode,
      dateFormat: format.dateFormat,
      timeFormat: format.timeFormat,
      currencyCode: format.currencyCode,
      currencySymbol: format.currencySymbol,
      numberFormat: format.numberFormat,
      decimalSeparator: format.decimalSeparator,
      thousandsSeparator: format.thousandsSeparator,
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Failed to update regional formats:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to update regional formats' },
      { status: 500 }
    )
  }
})
