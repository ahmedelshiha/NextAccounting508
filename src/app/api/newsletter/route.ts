import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  source: z.string().default('website')
})

// POST /api/newsletter - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = subscribeSchema.parse(body)
    const { email, name, source } = validatedData

    // Check if email is already subscribed
    const existingSubscription = await prisma.newsletterSubscription.findUnique({
      where: { email }
    })

    if (existingSubscription) {
      if (existingSubscription.active) {
        return NextResponse.json(
          { message: 'Email is already subscribed to our newsletter' },
          { status: 200 }
        )
      } else {
        // Reactivate subscription
        await prisma.newsletterSubscription.update({
          where: { email },
          data: {
            active: true,
            subscribedAt: new Date(),
            source
          }
        })
      }
    } else {
      // Create new subscription
      await prisma.newsletterSubscription.create({
        data: {
          email,
          name,
          source,
          active: true
        }
      })
    }

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Our Newsletter!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to Our Newsletter!</h2>
            
            <p>Dear ${name || 'Subscriber'},</p>
            
            <p>Thank you for subscribing to our newsletter! You'll now receive:</p>
            
            <ul>
              <li>Latest tax tips and strategies</li>
              <li>Financial planning insights</li>
              <li>Business growth advice</li>
              <li>Important deadline reminders</li>
              <li>Exclusive offers and updates</li>
            </ul>
            
            <p>We promise to only send valuable content and never spam your inbox.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">What's Next?</h3>
              <p>Keep an eye on your inbox for our weekly newsletter every Tuesday morning.</p>
              <p>In the meantime, feel free to:</p>
              <ul>
                <li><a href="${process.env.NEXTAUTH_URL}/blog" style="color: #2563eb;">Read our latest blog posts</a></li>
                <li><a href="${process.env.NEXTAUTH_URL}/services" style="color: #2563eb;">Explore our services</a></li>
                <li><a href="${process.env.NEXTAUTH_URL}/booking" style="color: #2563eb;">Book a free consultation</a></li>
              </ul>
            </div>
            
            <p>If you have any questions, feel free to reply to this email or contact us at info@accountingfirm.com.</p>
            
            <p>Best regards,<br>The Accounting Firm Team</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
              You received this email because you subscribed to our newsletter at ${process.env.NEXTAUTH_URL}.
              <br>
              <a href="${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #6b7280;">Unsubscribe</a>
            </p>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Successfully subscribed to newsletter'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
}

// GET /api/newsletter - Get newsletter subscriptions (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const limit = searchParams.get('limit')
    const skip = searchParams.get('skip')

    const where: any = {}
    
    if (active !== null) {
      where.active = active === 'true'
    }

    const subscriptions = await prisma.newsletterSubscription.findMany({
      where,
      orderBy: {
        subscribedAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined
    })

    const total = await prisma.newsletterSubscription.count({ where })

    return NextResponse.json({
      subscriptions,
      total,
      active: await prisma.newsletterSubscription.count({
        where: { active: true }
      })
    })
  } catch (error) {
    console.error('Error fetching newsletter subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletter subscriptions' },
      { status: 500 }
    )
  }
}

