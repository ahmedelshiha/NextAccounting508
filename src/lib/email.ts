import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export async function sendEmail(options: EmailOptions) {
  // If no SendGrid API key, log the email instead (for development)
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email would be sent:', {
      to: options.to,
      subject: options.subject,
      html: options.html
    })
    return { success: true, mock: true }
  }

  try {
    const msg = {
      to: options.to,
      from: options.from || process.env.FROM_EMAIL || 'noreply@accountingfirm.com',
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }

    await sgMail.send(msg)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

// Generate ICS calendar file content for booking confirmations
export function generateICS(booking: {
  id: string
  scheduledAt: Date
  duration: number
  clientName: string
  clientEmail: string
  service: { name: string }
}) {
  const startDate = new Date(booking.scheduledAt)
  const endDate = new Date(startDate.getTime() + booking.duration * 60000)
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Accounting Firm//Booking System//EN
BEGIN:VEVENT
UID:booking-${booking.id}@accountingfirm.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${booking.service.name} - Accounting Consultation
DESCRIPTION:Scheduled appointment for ${booking.service.name}
LOCATION:Accounting Firm Office
ORGANIZER:CN=Accounting Firm:MAILTO:appointments@accountingfirm.com
ATTENDEE:CN=${booking.clientName}:MAILTO:${booking.clientEmail}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

  return icsContent
}

// Send booking confirmation email with ICS attachment
export async function sendBookingConfirmation(booking: {
  id: string
  scheduledAt: Date
  duration: number
  clientName: string
  clientEmail: string
  service: { name: string; price?: number }
}) {
  const icsContent = generateICS(booking)
  const icsBase64 = Buffer.from(icsContent).toString('base64')
  
  const formattedDate = new Date(booking.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const formattedTime = new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  const emailOptions: EmailOptions = {
    to: booking.clientEmail,
    subject: `Booking Confirmation - ${booking.service.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Confirmation</h2>
        
        <p>Dear ${booking.clientName},</p>
        
        <p>Your appointment has been confirmed! Here are the details:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Appointment Details</h3>
          <p><strong>Service:</strong> ${booking.service.name}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Duration:</strong> ${booking.duration} minutes</p>
          ${booking.service.price ? `<p><strong>Price:</strong> $${booking.service.price}</p>` : ''}
        </div>
        
        <p>Please find the calendar invitation attached to this email. You can add this appointment to your calendar by opening the attachment.</p>
        
        <h3>What to Bring:</h3>
        <ul>
          <li>Valid ID</li>
          <li>Relevant financial documents</li>
          <li>List of questions or concerns</li>
        </ul>
        
        <h3>Office Location:</h3>
        <p>
          123 Business Street<br>
          Suite 100<br>
          Business City, BC 12345<br>
          Phone: (555) 123-4567
        </p>
        
        <p>If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.</p>
        
        <p>We look forward to meeting with you!</p>
        
        <p>Best regards,<br>The Accounting Firm Team</p>
      </div>
    `
  }

  // Add ICS attachment if SendGrid is configured
  if (process.env.SENDGRID_API_KEY) {
    const msg = {
      ...emailOptions,
      from: process.env.FROM_EMAIL || 'appointments@accountingfirm.com',
      attachments: [
        {
          content: icsBase64,
          filename: 'appointment.ics',
          type: 'text/calendar',
          disposition: 'attachment'
        }
      ]
    }

    await sgMail.send(msg)
  } else {
    // For development, just send the email without attachment
    await sendEmail(emailOptions)
  }
}

// Send booking reminder email
export async function sendBookingReminder(booking: {
  id: string
  scheduledAt: Date
  clientName: string
  clientEmail: string
  service: { name: string }
}) {
  const formattedDate = new Date(booking.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const formattedTime = new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  await sendEmail({
    to: booking.clientEmail,
    subject: `Reminder: Your appointment tomorrow - ${booking.service.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Reminder</h2>
        
        <p>Dear ${booking.clientName},</p>
        
        <p>This is a friendly reminder about your upcoming appointment:</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">Tomorrow's Appointment</h3>
          <p><strong>Service:</strong> ${booking.service.name}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
        </div>
        
        <p>Please arrive 10 minutes early and bring any relevant documents.</p>
        
        <p>If you need to reschedule, please contact us as soon as possible.</p>
        
        <p>Best regards,<br>The Accounting Firm Team</p>
      </div>
    `
  })
}
