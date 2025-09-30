import { z } from 'zod'

export const OrgGeneralSchema = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(200).optional().default(''),
  description: z.string().max(2000).optional().default(''),
  industry: z.string().max(120).optional().default('')
})

export const OrgContactSchema = z.object({
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  }).optional()
})

export const OrgLocalizationSchema = z.object({
  defaultTimezone: z.string().optional().default('UTC'),
  defaultCurrency: z.string().optional().default('USD'),
  defaultLocale: z.string().optional().default('en')
})

export const OrgBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  branding: z.record(z.any()).optional(),
  legalLinks: z.record(z.string()).optional()
})

export const OrganizationSettingsSchema = z.object({
  general: OrgGeneralSchema.optional(),
  contact: OrgContactSchema.optional(),
  localization: OrgLocalizationSchema.optional(),
  branding: OrgBrandingSchema.optional()
})

export type OrganizationSettings = z.infer<typeof OrganizationSettingsSchema>
