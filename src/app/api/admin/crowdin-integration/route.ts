import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import prisma from '@/lib/prisma'
import * as Sentry from '@sentry/nextjs'
import crypto from 'crypto'

interface CrowdinConfig {
  projectId: string
  apiToken: string
  autoSyncDaily: boolean
  syncOnDeploy: boolean
  createPrs: boolean
}

interface CrowdinResponse {
  projectId: string
  apiTokenMasked: string
  autoSyncDaily: boolean
  syncOnDeploy: boolean
  createPrs: boolean
  lastSyncAt: string | null
  lastSyncStatus: string | null
  testConnectionOk: boolean
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production'

function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decryptToken(encrypted: string): string {
  const parts = encrypted.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
  let decrypted = decipher.update(parts[1], 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

function maskToken(token: string): string {
  if (token.length <= 20) return '*'.repeat(token.length)
  return '*'.repeat(token.length - 20) + token.slice(-20)
}

/**
 * GET /api/admin/crowdin-integration
 * Fetch Crowdin integration settings
 */
export const GET = withTenantContext(async (request: NextRequest, context: any) => {
  try {
    const tenantId = context.tenantId

    const integration = await prisma.crowdinIntegration.findUnique({
      where: { tenantId },
      select: {
        projectId: true,
        apiTokenMasked: true,
        autoSyncDaily: true,
        syncOnDeploy: true,
        createPrs: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        testConnectionOk: true,
      },
    })

    if (!integration) {
      return NextResponse.json({ data: null })
    }

    const response: CrowdinResponse = {
      projectId: integration.projectId,
      apiTokenMasked: integration.apiTokenMasked,
      autoSyncDaily: integration.autoSyncDaily,
      syncOnDeploy: integration.syncOnDeploy,
      createPrs: integration.createPrs,
      lastSyncAt: integration.lastSyncAt?.toISOString() || null,
      lastSyncStatus: integration.lastSyncStatus,
      testConnectionOk: integration.testConnectionOk,
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Failed to fetch Crowdin integration:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to fetch Crowdin integration' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/admin/crowdin-integration
 * Create or update Crowdin integration settings
 */
export const POST = withTenantContext(async (request: NextRequest, context: any) => {
  try {
    const tenantId = context.tenantId
    const body = await request.json() as CrowdinConfig

    if (!body.projectId || !body.apiToken) {
      return NextResponse.json(
        { error: 'projectId and apiToken are required' },
        { status: 400 }
      )
    }

    const encryptedToken = encryptToken(body.apiToken)
    const maskedToken = maskToken(body.apiToken)

    const integration = await prisma.crowdinIntegration.upsert({
      where: { tenantId },
      create: {
        tenantId,
        projectId: body.projectId,
        apiTokenEncrypted: encryptedToken,
        apiTokenMasked: maskedToken,
        autoSyncDaily: body.autoSyncDaily ?? true,
        syncOnDeploy: body.syncOnDeploy ?? false,
        createPrs: body.createPrs ?? true,
        testConnectionOk: false,
      },
      update: {
        projectId: body.projectId,
        apiTokenEncrypted: encryptedToken,
        apiTokenMasked: maskedToken,
        autoSyncDaily: body.autoSyncDaily ?? true,
        syncOnDeploy: body.syncOnDeploy ?? false,
        createPrs: body.createPrs ?? true,
      },
    })

    Sentry.addBreadcrumb({
      category: 'crowdin.integration',
      message: 'Crowdin integration settings updated',
      level: 'info',
      data: {
        projectId: body.projectId,
        maskedToken: maskedToken,
      },
    })

    const response: CrowdinResponse = {
      projectId: integration.projectId,
      apiTokenMasked: integration.apiTokenMasked,
      autoSyncDaily: integration.autoSyncDaily,
      syncOnDeploy: integration.syncOnDeploy,
      createPrs: integration.createPrs,
      lastSyncAt: integration.lastSyncAt?.toISOString() || null,
      lastSyncStatus: integration.lastSyncStatus,
      testConnectionOk: integration.testConnectionOk,
    }

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (error) {
    console.error('Failed to update Crowdin integration:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to update Crowdin integration' },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/admin/crowdin-integration
 * Delete Crowdin integration settings
 */
export const DELETE = withTenantContext(async (request: NextRequest, context: any) => {
  try {
    const tenantId = context.tenantId

    await prisma.crowdinIntegration.delete({
      where: { tenantId },
    })

    Sentry.addBreadcrumb({
      category: 'crowdin.integration',
      message: 'Crowdin integration deleted',
      level: 'info',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete Crowdin integration:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to delete Crowdin integration' },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/admin/crowdin-integration
 * Test Crowdin connection
 */
export const PUT = withTenantContext(async (request: NextRequest, context: any) => {
  try {
    const tenantId = context.tenantId
    const body = await request.json() as { projectId: string; apiToken: string }

    if (!body.projectId || !body.apiToken) {
      return NextResponse.json(
        { error: 'projectId and apiToken are required' },
        { status: 400 }
      )
    }

    const crowdinApiUrl = `https://api.crowdin.com/api/v2/projects/${body.projectId}`

    const response = await fetch(crowdinApiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${body.apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    const isValid = response.ok

    if (isValid) {
      await prisma.crowdinIntegration.upsert({
        where: { tenantId },
        create: {
          tenantId,
          projectId: body.projectId,
          apiTokenEncrypted: encryptToken(body.apiToken),
          apiTokenMasked: maskToken(body.apiToken),
          autoSyncDaily: true,
          syncOnDeploy: false,
          createPrs: true,
          testConnectionOk: true,
          lastSyncStatus: 'pending',
        },
        update: {
          testConnectionOk: true,
          lastSyncStatus: 'pending',
        },
      })
    }

    Sentry.addBreadcrumb({
      category: 'crowdin.test',
      message: isValid ? 'Crowdin connection test succeeded' : 'Crowdin connection test failed',
      level: isValid ? 'info' : 'warning',
      data: {
        projectId: body.projectId,
        success: isValid,
      },
    })

    return NextResponse.json({
      data: {
        success: isValid,
        message: isValid ? 'Connection successful' : 'Connection failed',
      },
    })
  } catch (error) {
    console.error('Failed to test Crowdin connection:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to test Crowdin connection' },
      { status: 500 }
    )
  }
})
