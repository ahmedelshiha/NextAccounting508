import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// POST /api/newsletter/unsubscribe - Unsubscribe from newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find and deactivate subscription
    const subscription = await prisma.newsletter.findUnique({
      where: { email }
    })

    if (!subscription) {
      return NextResponse.json(
        { message: 'Email not found in our newsletter list' },
        { status: 404 }
      )
    }

    if (!subscription.subscribed) {
      return NextResponse.json(
        { message: 'Email is already unsubscribed' },
        { status: 200 }
      )
    }

    // Deactivate subscription
    await prisma.newsletter.update({
      where: { email },
      data: {
        subscribed: false,
        updatedAt: new Date()
      }
    })

    // Send confirmation email
    try {
      await sendEmail({
        to: email,
        subject: 'You have been unsubscribed',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Unsubscribed Successfully</h2>
            
            <p>You have been successfully unsubscribed from our newsletter.</p>
            
            <p>We're sorry to see you go! If you change your mind, you can always subscribe again on our website.</p>
            
            <p>If you have any feedback about why you unsubscribed, we'd love to hear from you. Just reply to this email.</p>
            
            <p>Best regards,<br>The Accounting Firm Team</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
              If you didn't request this unsubscription, please contact us at info@accountingfirm.com
            </p>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Failed to send unsubscribe confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Successfully unsubscribed from newsletter'
    })
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe from newsletter' },
      { status: 500 }
    )
  }
}

// GET /api/newsletter/unsubscribe - Unsubscribe page (for email links)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Find subscription
    const subscription = await prisma.newsletter.findUnique({
      where: { email }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Email not found in our newsletter list' },
        { status: 404 }
      )
    }

    if (!subscription.subscribed) {
      return NextResponse.json({
        message: 'Email is already unsubscribed',
        email,
        status: 'already_unsubscribed'
      })
    }

    // Deactivate subscription
    await prisma.newsletter.update({
      where: { email },
      data: {
        subscribed: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Successfully unsubscribed from newsletter',
      email,
      status: 'unsubscribed'
    })
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe from newsletter' },
      { status: 500 }
    )
  }
}
