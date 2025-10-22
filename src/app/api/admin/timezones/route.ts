import { NextResponse } from 'next/server'
import { getTimezonesWithOffsets } from '@/lib/timezone-helper'
import { withTenantContext } from '@/lib/api-wrapper'

/**
 * GET /api/admin/timezones
 * Returns all available timezones with UTC offsets and abbreviations
 * Used by LocalizationTab timezone selector
 */
export const GET = withTenantContext(async () => {
  try {
    const timezones = getTimezonesWithOffsets()
    return NextResponse.json({
      data: timezones,
      count: timezones.length
    }, {
      headers: {
        'Cache-Control': 'public, max-age=86400, immutable'
      }
    })
  } catch (error) {
    console.error('Failed to fetch timezones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timezones' },
      { status: 500 }
    )
  }
})
