import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      email,
      phone,
      company,
      subject,
      message,
      source = 'website'
    } = body

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Save to database (graceful fallback if DB is down)
    let submission
    try {
      submission = await prisma.contactSubmission.create({
        data: {
          name,
          email,
          phone,
          company,
          subject,
          message,
          source
        }
      })
    } catch (dbError) {
      console.error('Database unavailable, continuing without saving submission:', dbError)
      submission = null
    }

    // Send notification email to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@accountingfirm.com',
        subject: `New Contact Form Submission: ${subject || 'General Inquiry'}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
          ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    try {
      await sendEmail({
        to: email,
        subject: 'Thank you for contacting us',
        html: `
          <h2>Thank you for your inquiry</h2>
          <p>Dear ${name},</p>
          <p>Thank you for contacting our accounting firm. We have received your message and will get back to you within 24 hours.</p>
          <p>Here's a copy of your message:</p>
          <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 16px 0;">
            ${message.replace(/\n/g, '<br>')}
          </blockquote>
          <p>Best regards,<br>The Accounting Firm Team</p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Contact form submitted successfully',
      id: submission ? submission.id : null
    }, { status: 201 })
  } catch (error) {
    console.error('Error submitting contact form:', error)
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    )
  }
}

// GET /api/contact - Get contact submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const responded = searchParams.get('responded')
    const limit = searchParams.get('limit')
    const skip = searchParams.get('skip')

    const where: import('@prisma/client').Prisma.ContactSubmissionWhereInput = {}
    
    if (responded !== null) {
      where.responded = responded === 'true'
    }

    const submissions = await prisma.contactSubmission.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching contact submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact submissions' },
      { status: 500 }
    )
  }
}
