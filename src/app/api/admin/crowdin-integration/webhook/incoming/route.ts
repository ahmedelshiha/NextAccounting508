import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// POST - Receive webhook events from Crowdin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Verify webhook authenticity (in production, verify Crowdin signature)
    const signature = req.headers.get('x-crowdin-signature')
    const webhookSecret = process.env.CROWDIN_WEBHOOK_SECRET

    if (!signature || !webhookSecret) {
      console.warn('Webhook signature missing or not configured')
    }

    // Log webhook event
    const event = body.event || 'unknown'
    console.log(`[Crowdin Webhook] Event: ${event}`, {
      timestamp: new Date().toISOString(),
      eventData: JSON.stringify(body).substring(0, 200),
    })

    // Handle different webhook event types
    switch (event) {
      case 'translation.completed':
        return handleTranslationCompleted(body)
      case 'file.translated':
        return handleFileTranslated(body)
      case 'project.translated':
        return handleProjectTranslated(body)
      default:
        // Acknowledge unknown events
        return Response.json({
          success: true,
          message: `Event ${event} received and acknowledged`,
        })
    }
  } catch (error: any) {
    console.error('Webhook processing failed:', error)
    // Always return 200 to Crowdin to prevent retries on malformed data
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 200 })
  }
}

async function handleTranslationCompleted(data: any) {
  console.log('[Webhook] Translation completed', {
    language: data.language,
    progress: data.progress,
    timestamp: new Date().toISOString(),
  })

  return Response.json({
    success: true,
    message: 'Translation completion processed',
  })
}

async function handleFileTranslated(data: any) {
  console.log('[Webhook] File translated', {
    fileId: data.fileId,
    language: data.language,
    timestamp: new Date().toISOString(),
  })

  return Response.json({
    success: true,
    message: 'File translation processed',
  })
}

async function handleProjectTranslated(data: any) {
  console.log('[Webhook] Project translated', {
    projectId: data.projectId,
    language: data.language,
    timestamp: new Date().toISOString(),
  })

  return Response.json({
    success: true,
    message: 'Project translation processed',
  })
}
