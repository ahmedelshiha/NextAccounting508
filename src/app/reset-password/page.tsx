"use client"

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPasswordClient() {
  const router = useRouter()
  const params = useSearchParams()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const t = params.get('token') || ''
    setToken(t)
  }, [params])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return alert('Password must be at least 8 characters')
    if (password !== confirm) return alert('Passwords do not match')
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/password/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        alert('Password updated. You can now sign in.')
        router.push('/login')
      } else {
        alert(json?.error || 'Reset failed. The link may be expired.')
      }
    } catch {
      alert('Reset failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">AF</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Accounting Firm</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Set a new password</h2>
          <p className="mt-2 text-gray-600">Choose a strong password for your account.</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Reset password</CardTitle>
            <CardDescription className="text-center">Your reset link expires in 1 hour.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={onSubmit}>
              <input type="hidden" name="token" value={token} />
              <div>
                <Label htmlFor="password">New password</Label>
                <Input id="password" name="password" type="password" autoComplete="new-password" required placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !token}>
                {submitting ? 'Updating…' : 'Update password'}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                Remembered your password? <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">Sign in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <ResetPasswordClient />
    </Suspense>
  )
}
