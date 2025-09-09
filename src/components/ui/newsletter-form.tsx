'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NewsletterFormProps {
  placeholder?: string
  submitLabel?: string
  className?: string
}

export default function NewsletterForm({ placeholder = 'Enter your email', submitLabel = 'Subscribe', className = '' }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function validateEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (res.ok) {
        setSuccess('Thanks — you are subscribed!')
        setEmail('')
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error || data?.message || 'Failed to subscribe. Please try again later.')
      }
    } catch (err) {
      setError('Failed to subscribe. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`flex ${className}`}>
      <div className="flex-1">
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
        />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
      </div>
      <div className="ml-2">
        <Button type="submit" disabled={loading} className="whitespace-nowrap">
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
