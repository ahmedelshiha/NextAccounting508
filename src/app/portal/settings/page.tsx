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
        toast.success('Preferences saved')
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
        toast.error(err?.error?.message || 'Failed to save preferences')
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
      toast.error('Failed to save preferences')
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
            SMS reminders
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={smsConfirmation} onChange={(e) => setSmsConfirmation(e.target.checked)} />
            SMS confirmations
          </label>
        </div>
      </div>

      <div>
        <Label className="text-sm text-gray-700">Reminder timing</Label>
        <div className="mt-2 flex items-center gap-4 flex-wrap">
          {[24, 12, 6, 2].map(h => (
            <label key={h} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={reminderHours.includes(h)} onChange={(e) => toggleHour(h, e.target.checked)} />
              {h} hours before
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">We’ll send reminders within ~15 minutes of the selected times.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tz">Time zone</Label>
          <Input id="tz" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className="mt-1" placeholder="e.g. UTC or America/New_York" />
        </div>
        <div>
          <Label htmlFor="lang">Preferred language</Label>
          <Input id="lang" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} className="mt-1" placeholder="en" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={savingPrefs || loading}>{savingPrefs ? 'Saving…' : 'Save preferences'}</Button>
      </div>
    </div>
  )
}

export default function PortalSettingsPage() {
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
      toast.error('Name and email are required')
      return
    }
    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Require current password when changing email or password
    const changingEmail = email !== originalEmail
    const changingPassword = !!password
    if ((changingEmail || changingPassword) && !currentPassword) {
      toast.error('Current password is required to change email or password')
      return
    }

    setSaving(true)
    try {
        const payload: { name: string; email: string; password?: string; currentPassword?: string } = { name, email }
      if (password) payload.password = password
      // include current password for sensitive changes
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
        toast.success('Profile updated')
        // If changing email or password, sign out to refresh session tokens
        if (password || (email && email !== (user?.email ?? ''))) {
          setTimeout(async () => {
            await signOut({ callbackUrl: '/login' })
          }, 800)
        }
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to update profile')
      }
    } catch (e) {
      console.error('Save profile error', e)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete || confirmDelete.length < 6) {
      toast.error('Please enter your current password to confirm')
      return
    }
    setDeleting(true)
    try {
      const res = await apiFetch('/api/users/me', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: confirmDelete }) })
      if (res.ok) {
        toast.success('Account deleted')
        // Sign out and redirect to home
        await signOut({ callbackUrl: '/' })
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to delete account')
      }
    } catch (e) {
      console.error('Delete account error', e)
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600">Manage your profile and account details.</p>
          </div>
          <div>
            <Button variant="outline" asChild>
              <Link href="/portal">Back to Portal</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your name, email or password</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" placeholder="Leave blank to keep current password" />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" placeholder="Confirm new password" />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="currentPassword">Current Password (required to change email or password)</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1" placeholder="Enter your current password" />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" asChild>
                <Link href="/portal">Cancel</Link>
              </Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notifications & Reminders</CardTitle>
            <CardDescription>Control booking confirmations and reminder emails</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingPreferencesForm />

            <div className="grid grid-cols-1 gap-6 mt-8">
              <OfflineQueueInspector />
              <RealtimeConnectionPanel />
            </div>

            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Danger zone</h3>
              <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all related data. This action cannot be undone.</p>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive">Delete account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm account deletion</DialogTitle>
                    <DialogDescription>This action is permanent. Please enter your current password to confirm account deletion.</DialogDescription>
                  </DialogHeader>

                  <div className="mt-4">
                    <Label htmlFor="confirmDelete">Current Password</Label>
                    <Input id="confirmDelete" type="password" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} className="mt-2" placeholder="Enter your current password" />
                  </div>

                  <DialogFooter>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" asChild>
                        <Link href="/portal">Cancel</Link>
                      </Button>
                      <Button variant="destructive" onClick={handleDelete} disabled={deleting || confirmDelete.length < 6}>{deleting ? 'Deleting...' : 'Delete account'}</Button>
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
