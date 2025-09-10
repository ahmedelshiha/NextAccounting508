'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'

export default function PortalSettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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

    setSaving(true)
    try {
      const payload: any = { name, email }
      if (password) payload.password = password
      const res = await apiFetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast.success('Profile updated')
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

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" asChild>
                <Link href="/portal">Cancel</Link>
              </Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
