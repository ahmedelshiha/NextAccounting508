import { NextRequest, NextResponse } from 'next/server'
import { runScheduledTasks, updateBookingStatuses, cleanupOldData, generateMonthlyReports } from '@/lib/cron'
import { processBookingReminders } from '@/lib/cron/reminders'
import { authorizeCron, runCronTask } from '@/lib/cron/scheduler'
import { withTenantContext } from '@/lib/api-wrapper'

// POST /api/cron - Run scheduled tasks
const _api_POST = async (request: NextRequest) => {
  const auth = authorizeCron(request)
  if (auth) return auth
  try {

    const body = await request.json().catch(() => ({}))
    const { task } = body

    switch (task) {
      case 'booking-reminders':
        return NextResponse.json(await runCronTask('booking-reminders', () => processBookingReminders()))
      case 'booking-statuses':
        return NextResponse.json(await runCronTask('booking-statuses', () => updateBookingStatuses()))
      case 'cleanup':
        return NextResponse.json(await runCronTask('cleanup', () => cleanupOldData()))
      case 'monthly-report':
        return NextResponse.json(await runCronTask('monthly-report', () => generateMonthlyReports()))
      case 'all':
      default:
        return NextResponse.json(await runCronTask('all', () => runScheduledTasks()))
    }
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run scheduled tasks',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
}

// GET /api/cron - Get cron job information
const _api_GET = async (request: NextRequest) => {
  const auth = authorizeCron(request)
  if (auth) return auth
  try {

    return NextResponse.json({
      message: 'Cron job endpoint',
      available_tasks: [
        {
          task: 'all',
          description: 'Run all scheduled tasks',
          schedule: 'Daily at midnight and 9 AM'
        },
        {
          task: 'booking-reminders',
          description: 'Send booking reminder emails',
          schedule: 'Daily at 9 AM'
        },
        {
          task: 'booking-statuses',
          description: 'Update past booking statuses to completed',
          schedule: 'Daily at midnight'
        },
        {
          task: 'cleanup',
          description: 'Clean up old data',
          schedule: 'Weekly on Sundays'
        },
        {
          task: 'monthly-report',
          description: 'Generate monthly statistics report',
          schedule: 'First day of each month'
        }
      ],
      usage: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_CRON_SECRET',
          'Content-Type': 'application/json'
        },
        body: {
          task: 'all | booking-reminders | booking-statuses | cleanup | monthly-report'
        }
      },
      environment: {
        cron_secret_configured: !!process.env.CRON_SECRET,
        sendgrid_configured: !!process.env.SENDGRID_API_KEY
      }
    })
  } catch (error) {
    console.error('Cron info error:', error)
    return NextResponse.json(
      { error: 'Failed to get cron job information' },
      { status: 500 }
    )
  }
}

export const POST = withTenantContext(_api_POST, { requireAuth: false })
export const GET = withTenantContext(_api_GET, { requireAuth: false })
