'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import Tabs from '@/components/admin/settings/Tabs'
import { TextField, SelectField, Toggle, NumberField } from '@/components/admin/settings/FormField'
import { toastFromResponse, toastSuccess, toastError } from '@/lib/toast-api'
import { Button } from '@/components/ui/button'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ServicesSettingsModal({ open, onClose }: Props) {
  const [active, setActive] = useState<string>('services')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (!open) return
    // load current settings from server if available
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
      } catch (e) {
        // ignore load failures
      }
    })()
    return () => { ignore = true }
  }, [open])

  const save = async () => {
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
      if (res.ok) {
        toastSuccess('Settings saved')
        onClose()
      }
    } catch (e) {
      toastError(e, 'Save failed')
    } finally { setLoading(false) }
  }

  const tabs = [
    { key: 'services', label: 'Services' },
    { key: 'requests', label: 'Service Requests' }
  ]

  return (
    <PermissionGate permission={[PERMISSIONS.SERVICES_VIEW]} fallback={<div /> }>
      <Modal open={open} onClose={onClose} title="Services & Requests Settings" size="lg">
        <Tabs tabs={tabs} active={active} onChange={setActive} />

        {active === 'services' && (
          <div className="space-y-4">
            <TextField label="Default Category" value={defaultCategory} onChange={setDefaultCategory} placeholder="General" error={errors.defaultCategory} />
            <TextField label="Default Currency" value={defaultCurrency} onChange={setDefaultCurrency} placeholder="USD" error={errors.defaultCurrency} />
            <Toggle label="Allow cloning of services" value={allowCloning} onChange={setAllowCloning} />
            <Toggle label="Enable featured toggle on service card" value={featuredToggleEnabled} onChange={setFeaturedToggleEnabled} />
            <NumberField label="Price rounding (decimals)" value={priceRounding} onChange={setPriceRounding} min={0} max={6} error={errors.priceRounding} />
          </div>
        )}

        {active === 'requests' && (
          <div className="space-y-4">
            <SelectField label="Default Request Status" value={defaultRequestStatus} onChange={setDefaultRequestStatus} options={[{ value: 'SUBMITTED', label: 'Submitted' }, { value: 'IN_REVIEW', label: 'In Review' }, { value: 'ASSIGNED', label: 'Assigned' }]} error={errors.defaultRequestStatus} />
            <Toggle label="Auto-assign requests to team members" value={autoAssign} onChange={setAutoAssign} />
            <SelectField label="Auto-assign strategy" value={autoAssignStrategy} onChange={setAutoAssignStrategy} options={[{ value: 'round_robin', label: 'Round Robin' }, { value: 'load_based', label: 'Load-based' }, { value: 'skill_based', label: 'Skill-based' }]} error={errors.autoAssignStrategy} />
            <Toggle label="Allow conversion of requests to bookings" value={allowConvertToBooking} onChange={setAllowConvertToBooking} />
            <SelectField label="Default Booking Type" value={defaultBookingType} onChange={setDefaultBookingType} options={[{ value: 'STANDARD', label: 'Standard' }, { value: 'CONSULTATION', label: 'Consultation' }, { value: 'EMERGENCY', label: 'Emergency' }]} error={errors.defaultBookingType} />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save settings'}</Button>
        </div>
      </Modal>
    </PermissionGate>
  )
}
