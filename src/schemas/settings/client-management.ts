import { z } from 'zod'

export const ClientRegistrationSchema = z.object({
  requireAccount: z.boolean().default(false),
  emailVerification: z.boolean().default(true),
  duplicateCheck: z.enum(['none','email','email+phone']).default('email'),
  collectAddress: z.boolean().default(false),
})

export const ClientProfilesSchema = z.object({
  fields: z.array(z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text','email','phone','date','number']).default('text'),
    required: z.boolean().default(false),
    visibleInPortal: z.boolean().default(true),
    editableByClient: z.boolean().default(true),
  })).max(100).default([])
})

export const ClientCommunicationSchema = z.object({
  emailOptInDefault: z.boolean().default(true),
  smsOptInDefault: z.boolean().default(false),
  preferredChannel: z.enum(['email','sms','none']).default('email'),
  marketingOptInDefault: z.boolean().default(false),
})

export const ClientSegmentationSchema = z.object({
  tags: z.array(z.string().min(1)).max(200).default([]),
  autoSegments: z.array(z.object({
    name: z.string().min(1),
    rule: z.string().min(1), // stored as simple DSL or JSON string; evaluated server-side elsewhere
    active: z.boolean().default(true),
  })).max(100).default([])
})

export const ClientLoyaltySchema = z.object({
  enabled: z.boolean().default(false),
  pointsPerDollar: z.number().min(0).max(100).default(0),
  tiers: z.array(z.object({ tier: z.string().min(1), minPoints: z.number().min(0) })).max(10).default([]),
})

export const ClientPortalSchema = z.object({
  allowDocumentUpload: z.boolean().default(true),
  allowInvoiceView: z.boolean().default(true),
  allowPaymentHistory: z.boolean().default(true),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
})

export const ClientManagementSettingsSchema = z.object({
  registration: ClientRegistrationSchema.default({
    requireAccount: false,
    emailVerification: true,
    duplicateCheck: 'email',
    collectAddress: false,
  }),
  profiles: ClientProfilesSchema.default({
    fields: [],
  }),
  communication: ClientCommunicationSchema.default({
    emailOptInDefault: true,
    smsOptInDefault: false,
    preferredChannel: 'email',
    marketingOptInDefault: false,
  }),
  segmentation: ClientSegmentationSchema.default({
    tags: [],
    autoSegments: [],
  }),
  loyalty: ClientLoyaltySchema.default({
    enabled: false,
    pointsPerDollar: 0,
    tiers: [],
  }),
  portal: ClientPortalSchema.default({
    allowDocumentUpload: true,
    allowInvoiceView: true,
    allowPaymentHistory: true,
    language: 'en',
    timezone: 'UTC',
  }),
})

export type ClientRegistration = z.infer<typeof ClientRegistrationSchema>
export type ClientProfiles = z.infer<typeof ClientProfilesSchema>
export type ClientCommunication = z.infer<typeof ClientCommunicationSchema>
export type ClientSegmentation = z.infer<typeof ClientSegmentationSchema>
export type ClientLoyalty = z.infer<typeof ClientLoyaltySchema>
export type ClientPortal = z.infer<typeof ClientPortalSchema>
export type ClientManagementSettings = z.infer<typeof ClientManagementSettingsSchema>
