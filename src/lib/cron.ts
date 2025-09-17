import prisma from '@/lib/prisma'
import { sendBookingReminder } from '@/lib/email'
import { addDays, startOfDay, endOfDay } from 'date-fns'
import { $Enums } from '@prisma/client'
import prisma from '@/lib/prisma'

// Send booking reminders for appointments tomorrow
export async function sendBookingReminders() {
  try {
    const tomorrow = addDays(new Date(), 1)
    const startOfTomorrow = startOfDay(tomorrow)
    const endOfTomorrow = endOfDay(tomorrow)

    // Get all confirmed bookings for tomorrow
    const bookings = await prisma.booking.findMany({
      where: {
        scheduledAt: {
          gte: startOfTomorrow,
          lte: endOfTomorrow
        },
        status: $Enums.BookingStatus.CONFIRMED,
        reminderSent: false
      },
      include: {
        service: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`Found ${bookings.length} bookings for reminder emails`)

    let successCount = 0
    let errorCount = 0

    for (const booking of bookings) {
      try {
        await sendBookingReminder({
          id: booking.id,
          scheduledAt: booking.scheduledAt,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          service: {
            name: booking.service.name
          }
        })

        // Mark reminder as sent
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true }
        })

        successCount++
        console.log(`Reminder sent for booking ${booking.id}`)
      } catch (error) {
        errorCount++
        console.error(`Failed to send reminder for booking ${booking.id}:`, error)
      }
    }

    console.log(`Booking reminders completed: ${successCount} sent, ${errorCount} failed`)
    
    return {
      total: bookings.length,
      sent: successCount,
      failed: errorCount
    }
  } catch (error) {
    console.error('Error in sendBookingReminders:', error)
    throw error
  }
}

// Clean up old newsletter subscriptions and contact submissions
export async function cleanupOldData() {
  try {
    const sixMonthsAgo = addDays(new Date(), -180)
    
    // Delete old unsubscribed newsletter subscriptions
    const deletedSubscriptions = await prisma.newsletter.deleteMany({
      where: {
        subscribed: false,
        updatedAt: {
          lt: sixMonthsAgo
        }
      }
    })

    // Delete old contact submissions (keep for 1 year)
    const oneYearAgo = addDays(new Date(), -365)
    const deletedSubmissions = await prisma.contactSubmission.deleteMany({
      where: {
        createdAt: {
          lt: oneYearAgo
        }
      }
    })

    console.log(`Cleanup completed: ${deletedSubscriptions.count} old subscriptions, ${deletedSubmissions.count} old submissions deleted`)
    
    return {
      deletedSubscriptions: deletedSubscriptions.count,
      deletedSubmissions: deletedSubmissions.count
    }
  } catch (error) {
    console.error('Error in cleanupOldData:', error)
    throw error
  }
}

// Update booking statuses (mark past bookings as completed)
export async function updateBookingStatuses() {
  try {
    const now = new Date()
    
    // Mark past confirmed bookings as completed
    const updatedBookings = await prisma.booking.updateMany({
      where: {
        scheduledAt: {
          lt: now
        },
        status: $Enums.BookingStatus.CONFIRMED
      },
      data: {
        status: $Enums.BookingStatus.COMPLETED
      }
    })

    console.log(`Updated ${updatedBookings.count} bookings to completed status`)
    
    return {
      updated: updatedBookings.count
    }
  } catch (error) {
    console.error('Error in updateBookingStatuses:', error)
    throw error
  }
}

// Generate monthly reports (placeholder for future implementation)
export async function generateMonthlyReports() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get monthly statistics
    const bookingsCount = await prisma.booking.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const newUsersCount = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const contactSubmissionsCount = await prisma.contactSubmission.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const newsletterSubscriptionsCount = await prisma.newsletter.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const report = {
      month: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      bookings: bookingsCount,
      newUsers: newUsersCount,
      contactSubmissions: contactSubmissionsCount,
      newsletterSubscriptions: newsletterSubscriptionsCount,
      generatedAt: now
    }

    console.log('Monthly report generated:', report)
    
    // In a real application, you might save this to the database
    // or send it via email to administrators
    
    return report
  } catch (error) {
    console.error('Error in generateMonthlyReports:', error)
    throw error
  }
}

// Main cron job runner
export async function runScheduledTasks() {
  console.log('Running scheduled tasks...')
  
  const results = {
    timestamp: new Date(),
    tasks: {} as Record<string, unknown>
  }

  try {
    // Send booking reminders (daily at 9 AM)
    results.tasks.bookingReminders = await sendBookingReminders()
  } catch (error) {
    results.tasks.bookingReminders = { error: (error as Error).message }
  }

  try {
    // Update booking statuses (daily at midnight)
    results.tasks.bookingStatuses = await updateBookingStatuses()
  } catch (error) {
    results.tasks.bookingStatuses = { error: (error as Error).message }
  }

  try {
    // Cleanup old data (weekly on Sundays)
    const today = new Date()
    if (today.getDay() === 0) { // Sunday
      results.tasks.cleanup = await cleanupOldData()
    }
  } catch (error) {
    results.tasks.cleanup = { error: (error as Error).message }
  }

  try {
    // Generate monthly reports (first day of each month)
    const today = new Date()
    if (today.getDate() === 1) { // First day of month
      results.tasks.monthlyReport = await generateMonthlyReports()
    }
  } catch (error) {
    results.tasks.monthlyReport = { error: (error as Error).message }
  }

  console.log('Scheduled tasks completed:', results)
  return results
}
