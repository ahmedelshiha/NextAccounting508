import prisma from '@/lib/prisma'
import { addDays } from 'date-fns'

// Send booking reminders via shared scheduler logic to avoid duplication
export async function sendBookingReminders() {
  try {
    const { processBookingReminders } = await import('@/lib/cron/reminders')
    const res = await processBookingReminders()
    const total = Object.values(res.tenantStats || {}).reduce((s, t: any) => s + Number((t as any).total || 0), 0)
    const sent = Object.values(res.tenantStats || {}).reduce((s, t: any) => s + Number((t as any).sent || 0), 0)
    const failed = Object.values(res.tenantStats || {}).reduce((s, t: any) => s + Number((t as any).failed || 0), 0)
    return { total, sent, failed, durationMs: res.durationMs, errorRate: res.errorRate }
  } catch (error) {
    console.error('Error in sendBookingReminders:', error)
    throw error
  }
}

// Clean up old newsletter subscriptions and contact submissions
export async function cleanupOldData() {
  try {
    const sixMonthsAgo = addDays(new Date(), -180)
    const thirtyDaysAgo = addDays(new Date(), -30)

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

    // Delete chat messages older than 30 days (if table exists)
    let deletedChat = 0
    try {
      const res = await prisma.chatMessage.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo } }
      })
      deletedChat = res.count || 0
    } catch {
      // ignore if table/model not present
    }

    console.log(`Cleanup completed: ${deletedSubscriptions.count} old subscriptions, ${deletedSubmissions.count} old submissions, ${deletedChat} old chat messages deleted`)

    return {
      deletedSubscriptions: deletedSubscriptions.count,
      deletedSubmissions: deletedSubmissions.count,
      deletedChat
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
        status: 'CONFIRMED'
      },
      data: {
        status: 'COMPLETED'
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
