import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function GET() {
  try {
    const to = process.env.ALERT_EMAIL
    const from = process.env.FROM_EMAIL
    const apiKey = process.env.SENDGRID_API_KEY
    if (!to || !from || !apiKey) {
      return NextResponse.json({ status: 'error', error: 'Missing email env vars' }, { status: 500 })
    }

    await sendEmail({
      to,
      from,
      subject: 'Email Health Check',
      html: '<p>This is a test email from the health check.</p>',
    })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Email health check failed:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
