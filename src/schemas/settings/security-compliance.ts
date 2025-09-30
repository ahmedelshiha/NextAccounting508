import { z } from 'zod'

export const PasswordPolicySchema = z.object({
  minLength: z.number().min(6).max(128).default(12),
  requireUppercase: z.boolean().default(true),
  requireLowercase: z.boolean().default(true),
  requireNumber: z.boolean().default(true),
  requireSymbol: z.boolean().default(false),
  rotationDays: z.number().min(0).max(365).default(0),
})

export const SessionSecuritySchema = z.object({
  sessionTimeoutMinutes: z.number().min(5).max(1440).default(60),
  idleTimeoutMinutes: z.number().min(1).max(720).default(30),
  maxConcurrentSessions: z.number().min(1).max(20).default(5),
  enforceSingleSession: z.boolean().default(false),
  refreshTokenRotation: z.boolean().default(true),
})

export const TwoFactorSchema = z.object({
  requiredForAdmins: z.boolean().default(true),
  allowedMethods: z.array(z.enum(['totp','email','sms'])).min(1).default(['totp','email']),
  backupCodes: z.number().min(0).max(20).default(5),
})

export const NetworkPolicySchema = z.object({
  ipAllowlist: z.array(z.string().min(3)).max(200).default([]),
  ipBlocklist: z.array(z.string().min(3)).max(200).default([]),
  blockTorExitNodes: z.boolean().default(false),
  geoRestrictions: z.array(z.string().length(2)).max(200).default([]), // ISO country codes
})

export const DataProtectionSchema = z.object({
  auditLogRetentionDays: z.number().min(7).max(3650).default(365),
  piiRedactionEnabled: z.boolean().default(true),
  exportRequestsEnabled: z.boolean().default(true),
  legalHoldEnabled: z.boolean().default(false),
  documentRetentionDays: z.number().min(0).max(3650).default(730),
})

export const ComplianceSchema = z.object({
  gdprEnabled: z.boolean().default(true),
  hipaaEnabled: z.boolean().default(false),
  soc2Enabled: z.boolean().default(false),
  requireDpa: z.boolean().default(false),
})

export const SecurityComplianceSettingsSchema = z.object({
  passwordPolicy: PasswordPolicySchema.default({
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSymbol: false,
    rotationDays: 0,
  }),
  sessionSecurity: SessionSecuritySchema.default({
    sessionTimeoutMinutes: 60,
    idleTimeoutMinutes: 30,
    maxConcurrentSessions: 5,
    enforceSingleSession: false,
    refreshTokenRotation: true,
  }),
  twoFactor: TwoFactorSchema.default({
    requiredForAdmins: true,
    allowedMethods: ['totp','email'],
    backupCodes: 5,
  }),
  network: NetworkPolicySchema.default({
    ipAllowlist: [],
    ipBlocklist: [],
    blockTorExitNodes: false,
    geoRestrictions: [],
  }),
  dataProtection: DataProtectionSchema.default({
    auditLogRetentionDays: 365,
    piiRedactionEnabled: true,
    exportRequestsEnabled: true,
    legalHoldEnabled: false,
    documentRetentionDays: 730,
  }),
  compliance: ComplianceSchema.default({
    gdprEnabled: true,
    hipaaEnabled: false,
    soc2Enabled: false,
    requireDpa: false,
  }),
})

export type PasswordPolicy = z.infer<typeof PasswordPolicySchema>
export type SessionSecurity = z.infer<typeof SessionSecuritySchema>
export type TwoFactor = z.infer<typeof TwoFactorSchema>
export type NetworkPolicy = z.infer<typeof NetworkPolicySchema>
export type DataProtection = z.infer<typeof DataProtectionSchema>
export type Compliance = z.infer<typeof ComplianceSchema>
export type SecurityComplianceSettings = z.infer<typeof SecurityComplianceSettingsSchema>
