import { z } from 'zod'

export const FinancialInvoicingSchema = z.object({
  invoicePrefix: z.string().max(10).default('INV'),
  nextNumber: z.number().int().min(1).default(1),
  dueDaysDefault: z.number().int().min(0).max(365).default(30),
  autoNumbering: z.boolean().default(true),
  sendInvoiceEmail: z.boolean().default(true),
})

export const FinancialPaymentsSchema = z.object({
  currency: z.string().default('USD'),
  allowCOD: z.boolean().default(false),
  allowBankTransfer: z.boolean().default(true),
  allowCard: z.boolean().default(true),
  paymentProvider: z.enum(['none','stripe','paypal']).default('none'),
  captureMode: z.enum(['authorize_capture','authorize_only']).default('authorize_capture'),
})

export const FinancialTaxesSchema = z.object({
  taxInclusive: z.boolean().default(false),
  defaultRate: z.number().min(0).max(1).default(0),
  regionOverrides: z.record(z.number().min(0).max(1)).default({}),
})

export const FinancialCurrenciesSchema = z.object({
  base: z.string().default('USD'),
  enabled: z.array(z.string()).default(['USD']),
  roundingMode: z.enum(['HALF_UP','HALF_EVEN','DOWN','UP']).default('HALF_UP'),
})

export const FinancialReconciliationSchema = z.object({
  autoMatchThresholdCents: z.number().int().min(0).max(10000).default(200),
  lockPeriodDays: z.number().int().min(0).max(365).default(0),
  requireTwoPersonApproval: z.boolean().default(false),
})

export const FinancialSettingsSchema = z.object({
  invoicing: FinancialInvoicingSchema.optional(),
  payments: FinancialPaymentsSchema.optional(),
  taxes: FinancialTaxesSchema.optional(),
  currencies: FinancialCurrenciesSchema.optional(),
  reconciliation: FinancialReconciliationSchema.optional(),
})

export type FinancialSettingsPayload = z.infer<typeof FinancialSettingsSchema>
