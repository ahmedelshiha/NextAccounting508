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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await apiFetch('/api/users/me')
        if (res.ok) {
          const json = await res.json()
          const user = json.user
          setName(user.name || '')
          setEmail(user.email || '')
          setOriginalEmail(user.email || '')
        }
      } catch (e) {
        console.error('Failed to load user', e)
      } finally {
        setLoading(false)
      }
    }
    if (session) load()
  }, [session])

  const handleSave = async () => {
    if (!name || !email) {
      toast.error(t('portal.account.validation.nameEmailRequired'))
      return
    }
    if (password && password.length < 6) {
      toast.error(t('portal.account.validation.passwordMin'))
      return
    }
    if (password && password !== confirmPassword) {
      toast.error(t('portal.account.validation.passwordsMismatch'))
      return
    }

    const changingEmail = email !== originalEmail
    const changingPassword = !!password
    if ((changingEmail || changingPassword) && !currentPassword) {
      toast.error(t('portal.account.validation.currentPasswordRequired'))
      return
    }

    setSaving(true)
    try {
      const payload: { name: string; email: string; password?: string; currentPassword?: string } = { name, email }
      if (password) payload.password = password
      if (currentPassword) payload.currentPassword = currentPassword

      const res = await apiFetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const json = await res.json().catch(() => ({}))
        const user = json.user
        if (user) {
          setName(user.name || '')
          setEmail(user.email || '')
        }
        toast.success(t('portal.account.updated'))
        if (password || (email && email !== (user?.email ?? ''))) {
          setTimeout(async () => {
            await signOut({ callbackUrl: '/login' })
          }, 800)
        }
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('portal.account.updateFailed'))
      }
    } catch (e) {
      console.error('Save profile error', e)
      toast.error(t('portal.account.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete || confirmDelete.length < 6) {
      toast.error(t('portal.account.enterPasswordToConfirm'))
      return
    }
    setDeleting(true)
    try {
      const res = await apiFetch('/api/users/me', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: confirmDelete }) })
      if (res.ok) {
        toast.success(t('portal.account.deleted'))
        await signOut({ callbackUrl: '/' })
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('portal.account.deleteFailed'))
      }
    } catch (e) {
      console.error('Delete account error', e)
      toast.error(t('portal.account.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('portal.account.title')}</h1>
            <p className="text-gray-600">{t('portal.account.subtitle')}</p>
          </div>
          <div>
            <Button variant="outline" asChild aria-label={t('portal.backToPortal')}>
              <Link href="/portal">{t('portal.backToPortal')}</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('portal.account.profileTitle')}</CardTitle>
            <CardDescription>{t('portal.account.profileDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('portal.account.fullName')}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" aria-label={t('portal.account.fullName')} />
              </div>
              <div>
                <Label htmlFor="email">{t('common.email')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" aria-label={t('common.email')} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">{t('portal.account.newPassword')}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" placeholder={t('portal.account.passwordKeepPlaceholder')} aria-label={t('portal.account.newPassword')} />
              </div>
              <div>
                <Label htmlFor="confirm">{t('portal.account.confirmPassword')}</Label>
                <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" placeholder={t('portal.account.confirmPasswordPlaceholder')} aria-label={t('portal.account.confirmPassword')} />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="currentPassword">{t('portal.account.currentPasswordLabel')}</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1" placeholder={t('portal.account.currentPasswordPlaceholder')} aria-label={t('portal.account.currentPasswordLabel')} />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" asChild aria-label={t('common.cancel')}>
                <Link href="/portal">{t('common.cancel')}</Link>
              </Button>
              <Button onClick={handleSave} disabled={saving} aria-label={t('portal.account.saveChanges')}>{saving ? t('portal.account.saving') : t('portal.account.saveChanges')}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('portal.account.notificationsTitle')}</CardTitle>
            <CardDescription>{t('portal.account.notificationsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingPreferencesForm />

            <div className="grid grid-cols-1 gap-6 mt-8">
              <OfflineQueueInspector />
              <RealtimeConnectionPanel />
            </div>

            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('portal.account.danger.title')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('portal.account.danger.description')}</p>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" aria-label={t('portal.account.delete')}>{t('portal.account.delete')}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('portal.account.deleteConfirm.title')}</DialogTitle>
                    <DialogDescription>{t('portal.account.deleteConfirm.description')}</DialogDescription>
                  </DialogHeader>

                  <div className="mt-4">
                    <Label htmlFor="confirmDelete">{t('portal.account.currentPassword')}</Label>
                    <Input id="confirmDelete" type="password" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} className="mt-2" placeholder={t('portal.account.currentPasswordPlaceholder')} aria-label={t('portal.account.currentPassword')} />
                  </div>

                  <DialogFooter>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" asChild aria-label={t('common.cancel')}>
                        <Link href="/portal">{t('common.cancel')}</Link>
                      </Button>
                      <Button variant="destructive" onClick={handleDelete} disabled={deleting || confirmDelete.length < 6} aria-label={t('portal.account.delete')}>
                        {deleting ? t('portal.account.deleting') : t('portal.account.delete')}
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
