import prisma from '@/lib/prisma'

const defaultSettings = {
  id: `sec_${Date.now()}`,
  tenantId: null,
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSymbol: false,
    rotationDays: 0,
  },
  sessionSecurity: {
    sessionTimeoutMinutes: 60,
    idleTimeoutMinutes: 30,
    maxConcurrentSessions: 5,
    enforceSingleSession: false,
    refreshTokenRotation: true,
  },
  twoFactor: {
    requiredForAdmins: true,
    allowedMethods: ['totp', 'email'],
    backupCodes: 5,
  },
  network: {
    ipAllowlist: [],
    ipBlocklist: [],
    blockTorExitNodes: false,
    geoRestrictions: [],
  },
  dataProtection: {
    auditLogRetentionDays: 365,
    piiRedactionEnabled: true,
    exportRequestsEnabled: true,
    legalHoldEnabled: false,
    documentRetentionDays: 730,
  },
  compliance: {
    gdprEnabled: true,
    hipaaEnabled: false,
    soc2Enabled: false,
    requireDpa: false,
  },
  superAdmin: {
    stepUpMfa: false,
    logAdminAccess: true,
  },
}

async function upsertDefaults() {
  try {
    // Upsert global defaults (tenantId null)
    const existing = await prisma.securitySettings.findFirst({ where: { tenantId: null } })
    if (!existing) {
      await prisma.securitySettings.create({ data: defaultSettings })
      console.log('Created global default security settings')
    } else {
      await prisma.securitySettings.update({ where: { id: existing.id }, data: { ...defaultSettings, id: undefined } })
      console.log('Updated existing global security settings')
    }

    // Example tenant seed (tenant 't1') if not present
    const tenantId = 't1'
    const existingT = await prisma.securitySettings.findFirst({ where: { tenantId } })
    if (!existingT) {
      await prisma.securitySettings.create({ data: { ...defaultSettings, id: `sec_${tenantId}_${Date.now()}`, tenantId } })
      console.log(`Created security settings for tenant ${tenantId}`)
    } else {
      console.log(`Security settings already present for tenant ${tenantId}`)
    }
  } catch (e) {
    console.error('Error seeding security settings', e)
    process.exitCode = 2
  } finally {
    await prisma.$disconnect()
  }
}

upsertDefaults()
