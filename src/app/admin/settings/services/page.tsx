'use client'

import React, { useEffect, useState, Suspense } from 'react'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import Tabs from '@/components/admin/settings/Tabs'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { usePermissions } from '@/lib/use-permissions'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'
import { TextField, SelectField, Toggle, NumberField } from '@/components/admin/settings/FormField'
import { toastFromResponse, toastSuccess, toastError } from '@/lib/toast-api'

export default function Page() {
  const tabList = [
    { key: 'services', label: 'Services' },
    { key: 'requests', label: 'Service Requests' },
  ]

  const [activeTab, setActiveTab] = useState<string>('services')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const perms = usePermissions()

  // Services settings
  const [defaultCategory, setDefaultCategory] = useState('General')
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [allowCloning, setAllowCloning] = useState(true)
  const [featuredToggleEnabled, setFeaturedToggleEnabled] = useState(true)
  const [priceRounding, setPriceRounding] = useState(2)

  // Service Requests settings
  const [defaultRequestStatus, setDefaultRequestStatus] = useState('SUBMITTED')
  const [autoAssign, setAutoAssign] = useState(true)
  const [autoAssignStrategy, setAutoAssignStrategy] = useState('round_robin')
  const [allowConvertToBooking, setAllowConvertToBooking] = useState(true)
  const [defaultBookingType, setDefaultBookingType] = useState('STANDARD')

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/settings/services')
        if (!res.ok) return
        const json = await res.json().catch(() => null)
        if (!json || ignore) return
        const s = (json?.data ?? json) || {}
        if (s.defaultCategory) setDefaultCategory(s.defaultCategory)
        if (s.defaultCurrency) setDefaultCurrency(s.defaultCurrency)
        if (typeof s.allowCloning === 'boolean') setAllowCloning(s.allowCloning)
        if (typeof s.featuredToggleEnabled === 'boolean') setFeaturedToggleEnabled(s.featuredToggleEnabled)
        if (typeof s.priceRounding === 'number') setPriceRounding(s.priceRounding)
        if (s.defaultRequestStatus) setDefaultRequestStatus(s.defaultRequestStatus)
        if (typeof s.autoAssign === 'boolean') setAutoAssign(s.autoAssign)
        if (s.autoAssignStrategy) setAutoAssignStrategy(s.autoAssignStrategy)
        if (typeof s.allowConvertToBooking === 'boolean') setAllowConvertToBooking(s.allowConvertToBooking)
        if (s.defaultBookingType) setDefaultBookingType(s.defaultBookingType)
      } catch {
        // silent
      }
    })()
    return () => { ignore = true }
  }, [])

  const onSave = async () => {
    const nextErrors: Record<string, string> = {}
    if (!defaultCategory?.trim()) nextErrors.defaultCategory = 'Required'
    if (!/^[A-Z]{3}$/.test(defaultCurrency)) nextErrors.defaultCurrency = 'Use 3-letter code (e.g., USD)'
    if (!Number.isInteger(priceRounding) || priceRounding < 0 || priceRounding > 6) nextErrors.priceRounding = '0–6 allowed'
    if (!['SUBMITTED','IN_REVIEW','ASSIGNED','APPROVED','DRAFT','IN_PROGRESS','COMPLETED','CANCELLED'].includes(defaultRequestStatus)) nextErrors.defaultRequestStatus = 'Invalid value'
    if (!['round_robin','load_based','skill_based'].includes(autoAssignStrategy)) nextErrors.autoAssignStrategy = 'Invalid value'
    if (!['STANDARD','RECURRING','EMERGENCY','CONSULTATION'].includes(defaultBookingType)) nextErrors.defaultBookingType = 'Invalid value'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const payload = {
        defaultCategory,
        defaultCurrency,
        allowCloning,
        featuredToggleEnabled,
        priceRounding,
        defaultRequestStatus,
        autoAssign,
        autoAssignStrategy,
        allowConvertToBooking,
        defaultBookingType,
      }
      const res = await fetch('/api/admin/settings/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      await toastFromResponse(res, { success: 'Settings saved', failure: 'Failed to save settings' })
      if (res.ok) toastSuccess('Settings saved')
    } catch (e) {
      toastError(e, 'Save failed')
    } finally { setLoading(false) }
  }

  return (
    <PermissionGate permission={[PERMISSIONS.SERVICES_VIEW]} fallback={<div /> }>
      <SettingsShell
        title="Service Management"
        description="Configure default categories, currency and service-request workflows"
        tabs={tabList}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        actions={(
          <div className="flex items-center gap-2">
            <button onClick={onSave} disabled={loading || !perms.has(PERMISSIONS.SERVICES_EDIT)} className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Saving…' : 'Save settings'}
            </button>
            <FavoriteToggle settingKey="serviceManagement" route="/admin/settings/services" label="Service Management" />
          </div>
        )}
      >
        <Suspense fallback={<div /> }>
          {activeTab === 'services' && (
            <div className="space-y-4">
              <TextField label="Default Category" value={defaultCategory} onChange={setDefaultCategory} placeholder="General" error={errors.defaultCategory} />
              <TextField label="Default Currency" value={defaultCurrency} onChange={setDefaultCurrency} placeholder="USD" error={errors.defaultCurrency} />
              <Toggle label="Allow cloning of services" value={allowCloning} onChange={setAllowCloning} />
              <Toggle label="Enable featured toggle on service card" value={featuredToggleEnabled} onChange={setFeaturedToggleEnabled} />
              <NumberField label="Price rounding (decimals)" value={priceRounding} onChange={setPriceRounding} min={0} max={6} error={errors.priceRounding} />
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              <SelectField label="Default Request Status" value={defaultRequestStatus} onChange={setDefaultRequestStatus} options={[{ value: 'SUBMITTED', label: 'Submitted' }, { value: 'IN_REVIEW', label: 'In Review' }, { value: 'ASSIGNED', label: 'Assigned' }]} error={errors.defaultRequestStatus} />
              <Toggle label="Auto-assign requests to team members" value={autoAssign} onChange={setAutoAssign} />
              <SelectField label="Auto-assign strategy" value={autoAssignStrategy} onChange={setAutoAssignStrategy} options={[{ value: 'round_robin', label: 'Round Robin' }, { value: 'load_based', label: 'Load-based' }, { value: 'skill_based', label: 'Skill-based' }]} error={errors.autoAssignStrategy} />
              <Toggle label="Allow conversion of requests to bookings" value={allowConvertToBooking} onChange={setAllowConvertToBooking} />
              <SelectField label="Default Booking Type" value={defaultBookingType} onChange={setDefaultBookingType} options={[{ value: 'STANDARD', label: 'Standard' }, { value: 'CONSULTATION', label: 'Consultation' }, { value: 'EMERGENCY', label: 'Emergency' }]} error={errors.defaultBookingType} />
            </div>
          )}
        </Suspense>
      </SettingsShell>
    </PermissionGate>
  )
}
