import { NextRequest, NextResponse } from 'next/server'
import { runScheduledTasks, sendBookingReminders, updateBookingStatuses, cleanupOldData, generateMonthlyReports } from '@/lib/cron'

// POST /api/cron - Run scheduled tasks
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron service or has the correct authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { task } = body

    let result

    switch (task) {
      case 'booking-reminders':
        result = await sendBookingReminders()
        break
      
      case 'booking-statuses':
        result = await updateBookingStatuses()
        break
      
      case 'cleanup':
        result = await cleanupOldData()
        break
      
      case 'monthly-report':
        result = await generateMonthlyReports()
        break
      
      case 'all':
      default:
        result = await runScheduledTasks()
        break
    }

    return NextResponse.json({
      success: true,
      task: task || 'all',
      result
    })
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
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
