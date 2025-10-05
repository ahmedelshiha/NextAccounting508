"use client"

export const dynamic = 'force-static'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
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
          <h2 className="text-3xl font-bold text-gray-900">Forgot your password?</h2>
          <p className="mt-2 text-gray-600">Enter your email and well send reset instructions if your account supports it.</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Reset password</CardTitle>
            <CardDescription className="text-center">Well email you a secure link to reset your password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault()
              const form = e.currentTarget as HTMLFormElement
              const fd = new FormData(form)
              const email = String(fd.get('email') || '')
              const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null
              if (btn) btn.disabled = true
              try {
                const res = await fetch('/api/auth/password/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
                if (res.ok) {
                  alert('If an account exists for that email, a reset link has been sent.')
                } else {
                  alert('Please try again later.')
                }
              } catch {
                alert('Please try again later.')
              } finally {
                if (btn) btn.disabled = false
              }
            }}>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
              </div>
              <Button type="submit" className="w-full">
                Send reset link
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                Need help? <Link href="/contact" className="text-blue-600 hover:text-blue-500 font-medium">Contact support</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
