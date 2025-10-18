'use client'

/**
 * ProductInfo Component
 * 
 * Display app name, version, and build information.
 * Supports both compact and full display modes.
 * 
 * @module @/components/admin/layout/Footer/ProductInfo
 */

import { getAppVersion, getBuildDate } from '@/lib/admin/version'
import { FOOTER_BRANDING } from './constants'
import type { ProductInfoProps } from './types'

export function ProductInfo({ compact = false }: ProductInfoProps) {
  const version = getAppVersion()
  const buildDate = getBuildDate()

  if (compact) {
    return (
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-gray-900">
          {FOOTER_BRANDING.appNameFull}
        </p>
        <p className="text-xs text-gray-500">{version}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-semibold text-gray-900">
        {FOOTER_BRANDING.appNameFull}
      </p>
      <div className="flex gap-2 text-xs text-gray-500">
        <span>{version}</span>
        <span className="text-gray-300">•</span>
        <span>{buildDate}</span>
      </div>
    </div>
  )
}

export default ProductInfo
