import { NextRequest, NextResponse } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { sendEmail, sendBookingConfirmation, sendBookingReminder } from '@/lib/email'

// POST /api/email/test - Test email functionality (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admins to test emails
    if (!session?.user || (session.user?.role ?? '') !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, email, ...params } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    let result
    
    switch (type) {
      case 'basic':
        result = await sendEmail({
          to: email,
          subject: 'Test Email from Accounting Firm',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Test Email</h2>
              <p>This is a test email from the Accounting Firm application.</p>
              <p>If you received this email, the email system is working correctly!</p>
              <p>Sent at: ${new Date().toLocaleString()}</p>
            </div>
          `
        })
        break

      case 'booking_confirmation':
        result = await sendBookingConfirmation({
          id: 'test-booking-id',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          duration: 60,
          clientName: params.clientName || 'Test Client',
          clientEmail: email,
          service: {
            name: params.serviceName || 'Test Service',
            price: params.price || 150
          }
        })
        break

      case 'booking_reminder':
        result = await sendBookingReminder({
          id: 'test-booking-id',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          clientName: params.clientName || 'Test Client',
          clientEmail: email,
          service: {
            name: params.serviceName || 'Test Service'
          }
        })
        break

      case 'contact_confirmation':
        result = await sendEmail({
          to: email,
          subject: 'Thank you for contacting us',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Thank you for your inquiry</h2>
              <p>Dear ${params.name || 'Valued Client'},</p>
              <p>Thank you for contacting our accounting firm. We have received your message and will get back to you within 24 hours.</p>
              <p>Here's a copy of your message:</p>
              <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 16px 0;">
                ${params.message || 'This is a test message for contact form confirmation.'}
              </blockquote>
              <p>Best regards,<br>The Accounting Firm Team</p>
            </div>
          `
        })
        break

      case 'newsletter_welcome':
        result = await sendEmail({
          to: email,
          subject: 'Welcome to Our Newsletter!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Welcome to Our Newsletter!</h2>
              <p>Thank you for subscribing to our newsletter! You'll now receive valuable tax tips and financial insights.</p>
              <p>This is a test welcome email.</p>
              <p>Best regards,<br>The Accounting Firm Team</p>
            </div>
          `
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid email type. Supported types: basic, booking_confirmation, booking_reminder, contact_confirmation, newsletter_welcome' },
          { status: 400 }
        )
    }

    const mockFlag = !!(result && typeof result === 'object' && 'mock' in (result as Record<string, unknown>) && (result as Record<string, unknown>).mock)
    return NextResponse.json({
      message: `Test email sent successfully to ${email}`,
      type,
      result: mockFlag ? 'Email logged to console (no SendGrid configured)' : 'Email sent via SendGrid'
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// GET /api/email/test - Get email test options
export async function GET(request: NextRequest) {
  void request
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user?.role ?? '') !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: 'Email testing endpoint',
      types: [
        {
          type: 'basic',
          description: 'Basic test email',
          required_params: ['email']
        },
        {
          type: 'booking_confirmation',
          description: 'Booking confirmation email with calendar attachment',
          required_params: ['email'],
          optional_params: ['clientName', 'serviceName', 'price']
        },
        {
          type: 'booking_reminder',
          description: 'Booking reminder email',
          required_params: ['email'],
          optional_params: ['clientName', 'serviceName']
        },
        {
          type: 'contact_confirmation',
          description: 'Contact form confirmation email',
          required_params: ['email'],
          optional_params: ['name', 'message']
        },
        {
          type: 'newsletter_welcome',
          description: 'Newsletter welcome email',
          required_params: ['email']
        }
      ],
      sendgrid_configured: !!process.env.SENDGRID_API_KEY,
      from_email: process.env.FROM_EMAIL || 'noreply@accountingfirm.com'
    })
  } catch (error) {
    console.error('Email test info error:', error)
    return NextResponse.json(
      { error: 'Failed to get email test info' },
      { status: 500 }
    )
  }
}
