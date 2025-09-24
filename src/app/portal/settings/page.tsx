'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import OfflineQueueInspector from '@/components/portal/OfflineQueueInspector'
import RealtimeConnectionPanel from '@/components/portal/RealtimeConnectionPanel'
import { signOut } from 'next-auth/react'
import { useTranslations } from '@/lib/i18n'

function BookingPreferencesForm() {
  const { t } = useTranslations()
  const [loading, setLoading] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [emailConfirmation, setEmailConfirmation] = useState(true)
  const [emailReminder, setEmailReminder] = useState(true)
  const [emailReschedule, setEmailReschedule] = useState(true)
  const [emailCancellation, setEmailCancellation] = useState(true)
  const [smsReminder, setSmsReminder] = useState(false)
  const [smsConfirmation, setSmsConfirmation] = useState(false)
  const [reminderHours, setReminderHours] = useState<number[]>([24,2])
  const [timeZone, setTimeZone] = useState('UTC')
  const [preferredLanguage, setPreferredLanguage] = useState('en')

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await apiFetch('/api/portal/settings/booking-preferences')
        const json = await res.json().catch(() => ({}))
        if (!ignore && json?.data) {
          const p = json.data
          setEmailConfirmation(p.emailConfirmation ?? true)
          setEmailReminder(p.emailReminder ?? true)
          setEmailReschedule(p.emailReschedule ?? true)
          setEmailCancellation(p.emailCancellation ?? true)
          setSmsReminder(p.smsReminder ?? false)
          setSmsConfirmation(p.smsConfirmation ?? false)
          setReminderHours(Array.isArray(p.reminderHours) ? p.reminderHours : [24,2])
          setTimeZone(p.timeZone || 'UTC')
          setPreferredLanguage(p.preferredLanguage || 'en')
        }
      } finally { if (!ignore) setLoading(false) }
    })()
    return () => { ignore = true }
  }, [])

  const toggleHour = (h: number, checked: boolean) => {
    setReminderHours(prev => {
      const set = new Set(prev)
      if (checked) set.add(h); else set.delete(h)
      return Array.from(set).sort((a,b) => b - a)
    })
  }

  const save = async () => {
    setSavingPrefs(true)
    const prev = { emailConfirmation, emailReminder, emailReschedule, emailCancellation, smsReminder, smsConfirmation, reminderHours, timeZone, preferredLanguage }
    // Optimistic UI already reflects current state from inputs; attempt to persist
    try {
      const res = await apiFetch('/api/portal/settings/booking-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailConfirmation,
          emailReminder,
          emailReschedule,
          emailCancellation,
          smsReminder,
          smsConfirmation,
          reminderHours,
          timeZone,
          preferredLanguage,
        })
      })
      if (res.ok) {
        toast.success(t('portal.settings.saved'))
      } else {
        // Rollback optimistic UI
        setEmailConfirmation(prev.emailConfirmation)
        setEmailReminder(prev.emailReminder)
        setEmailReschedule(prev.emailReschedule)
        setEmailCancellation(prev.emailCancellation)
        setSmsReminder(prev.smsReminder)
        setSmsConfirmation(prev.smsConfirmation)
        setReminderHours(prev.reminderHours)
        setTimeZone(prev.timeZone)
        setPreferredLanguage(prev.preferredLanguage)
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error?.message || t('portal.settings.saveFailed'))
      }
    } catch {
      // Rollback on network error
      setEmailConfirmation(prev.emailConfirmation)
      setEmailReminder(prev.emailReminder)
      setEmailReschedule(prev.emailReschedule)
      setEmailCancellation(prev.emailCancellation)
      setSmsReminder(prev.smsReminder)
      setSmsConfirmation(prev.smsConfirmation)
      setReminderHours(prev.reminderHours)
      setTimeZone(prev.timeZone)
      setPreferredLanguage(prev.preferredLanguage)
      toast.error(t('portal.settings.saveFailed'))
    } finally {
      setSavingPrefs(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={emailConfirmation} onChange={(e) => setEmailConfirmation(e.target.checked)} />
            {t('portal.settings.emailConfirmation')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={emailReminder} onChange={(e) => setEmailReminder(e.target.checked)} />
            {t('portal.settings.emailReminder')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={emailReschedule} onChange={(e) => setEmailReschedule(e.target.checked)} />
            {t('portal.settings.emailReschedule')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={emailCancellation} onChange={(e) => setEmailCancellation(e.target.checked)} />
            {t('portal.settings.emailCancellation')}
          </label>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={smsReminder} onChange={(e) => setSmsReminder(e.target.checked)} />
            {t('portal.settings.smsReminder')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={smsConfirmation} onChange={(e) => setSmsConfirmation(e.target.checked)} />
            {t('portal.settings.smsConfirmation')}
          </label>
        </div>
      </div>

      <div>
        <Label className="text-sm text-gray-700">{t('portal.settings.reminderTiming')}</Label>
        <div className="mt-2 flex items-center gap-4 flex-wrap">
          {[24, 12, 6, 2].map(h => (
            <label key={h} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={reminderHours.includes(h)} onChange={(e) => toggleHour(h, e.target.checked)} />
              {h} {t('portal.settings.hoursBefore')}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">{t('portal.settings.reminderNote')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tz">{t('portal.settings.timeZone')}</Label>
          <Input id="tz" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className="mt-1" placeholder={t('portal.settings.timeZonePlaceholder')} />
        </div>
        <div>
          <Label htmlFor="lang">{t('portal.settings.preferredLanguage')}</Label>
          <Input id="lang" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} className="mt-1" placeholder={t('portal.settings.languagePlaceholder')} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={savingPrefs || loading} aria-label={t('portal.settings.saveButton')}>{savingPrefs ? t('portal.settings.saving') : t('portal.settings.save')}</Button>
      </div>
    </div>
  )
}

export default function PortalSettingsPage() {
  const { t } = useTranslations()
  const { data: session } = useSession()
  const [_loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')</n