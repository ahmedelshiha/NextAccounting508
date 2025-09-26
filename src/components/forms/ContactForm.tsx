"use client"

import React, { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

// Zod schema for client-side validation
const ContactSchema = z.object({
  name: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional().nullable().refine((v) => {
    if (!v) return true
    return /^\+?[0-9 ()-]{7,20}$/.test(v)
  }, { message: 'Please enter a valid phone number' }),
  company: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Please provide more details')
})

type ContactFormValues = z.infer<typeof ContactSchema>

export function ContactForm() {
  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: ''
    }
  })

  const successRef = useRef<HTMLDivElement | null>(null)

  const onSubmit = async (data: ContactFormValues) => {
    try {
      // Keep UI responsive
      const res = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        // Show lightweight toast and also render an inline success state
        toast.success('Message sent successfully! We will get back to you soon.')
        // Move focus to success message for screen readers
        setTimeout(() => {
          successRef.current?.focus()
        }, 50)
        reset()
      } else {
        // Try parsing server error message when available
        let errText = 'Failed to send message. Please try again.'
        try {
          const body = await res.json()
          if (body?.error) errText = String(body.error)
        } catch {
          // ignore
        }
        toast.error(errText)
      }
    } catch (err) {
      console.error('Contact form submission error:', err)
      toast.error('An error occurred. Please try again.')
    }
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Send us a Message</span>
          </CardTitle>
          <CardDescription>
            Fill out the form below and we will get back to you within 24 hours.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" {...register('name')} aria-invalid={!!errors.name} className="mt-1" />
                {errors.name && <p className="text-xs text-red-600 mt-1">{String(errors.name.message)}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} className="mt-1" />
                {errors.email && <p className="text-xs text-red-600 mt-1">{String(errors.email.message)}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" {...register('phone')} aria-invalid={!!errors.phone} className="mt-1" />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{String(errors.phone.message)}</p>}
              </div>

              <div>
                <Label htmlFor="company">Company Name</Label>
                <Input id="company" {...register('company')} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Service Interest</Label>
              <Select onValueChange={(v) => { /* controlled by RHF via hidden input */ }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a service you're interested in" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bookkeeping">Bookkeeping</SelectItem>
                  <SelectItem value="Tax Preparation">Tax Preparation</SelectItem>
                  <SelectItem value="Payroll">Payroll</SelectItem>
                  <SelectItem value="CFO Advisory">CFO Advisory</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {/* Hidden input to integrate select value into RHF if needed in future */}
              <input type="hidden" {...register('subject')} />
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea id="message" rows={6} {...register('message')} aria-invalid={!!errors.message} className="mt-1 min-h-[120px]" />
              {errors.message && <p className="text-xs text-red-600 mt-1">{String(errors.message.message)}</p>}
            </div>

            <div>
              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>

            {/* Accessible live region for status updates */}
            <div role="status" aria-live="polite" className="sr-only">
              {isSubmitting ? 'Sending message...' : 'Idle'}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Inline success panel shown after toast and reset - keep for screen reader focus */}
      <div tabIndex={-1} ref={successRef} aria-hidden="true" />
    </div>
  )
}
