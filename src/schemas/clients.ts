import { z } from 'zod'

export const Step1Schema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional().refine((v) => !v || /^[\+]?([0-9]|\s|\-|\(|\)){5,}$/i.test(v || ''), 'Invalid phone number'),
  taxId: z.string().optional().refine((v) => !v || v.length >= 5, 'Tax ID looks invalid'),
})

export const Step2Schema = z.object({
  country: z.string().min(1, 'Country is required'),
})

export const Step7Schema = z.object({
  gdprConsent: z.literal(true, { message: 'GDPR consent is required' }),
})
