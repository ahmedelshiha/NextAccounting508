import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters long')
  .max(254, 'Email must be less than 254 characters long')
  .refine(
    (email) => !email.includes('..'),
    'Email cannot contain consecutive dots'
  )
  .refine(
    (email) => !email.startsWith('.') && !email.endsWith('.'),
    'Email cannot start or end with a dot'
  )

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/,'Invalid phone number format')
  .optional()

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters long')
  .max(50, 'Name must be less than 50 characters long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

export const companySchema = z
  .string()
  .min(2, 'Company name must be at least 2 characters long')
  .max(100, 'Company name must be less than 100 characters long')
  .regex(/^[a-zA-Z0-9\s&.,'-]+$/, 'Invalid company name format')
  .optional()

export const messageSchema = z
  .string()
  .min(10, 'Message must be at least 10 characters long')
  .max(2000, 'Message must be less than 2000 characters long')
  .refine(
    (message) => message.trim().length > 0,
    'Message cannot be empty or contain only whitespace'
  )

export const subjectSchema = z
  .string()
  .min(5, 'Subject must be at least 5 characters long')
  .max(100, 'Subject must be less than 100 characters long')
  .optional()

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters long')
  .max(100, 'Slug must be less than 100 characters long')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .refine(
    (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
    'Slug cannot start or end with a hyphen'
  )
  .refine(
    (slug) => !slug.includes('--'),
    'Slug cannot contain consecutive hyphens'
  )

export const titleSchema = z
  .string()
  .min(5, 'Title must be at least 5 characters long')
  .max(200, 'Title must be less than 200 characters long')
  .refine(
    (title) => title.trim().length > 0,
    'Title cannot be empty or contain only whitespace'
  )

export const contentSchema = z
  .string()
  .min(100, 'Content must be at least 100 characters long')
  .max(50000, 'Content must be less than 50,000 characters long')

export const priceSchema = z
  .number()
  .min(0, 'Price cannot be negative')
  .max(999999.99, 'Price cannot exceed $999,999.99')
  .optional()

export const durationSchema = z
  .number()
  .min(15, 'Duration must be at least 15 minutes')
  .max(480, 'Duration cannot exceed 8 hours (480 minutes)')
  .optional()

export const futureDateSchema = z
  .date()
  .refine(
    (date) => date > new Date(),
    'Date must be in the future'
  )

export const userRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword']
  }
)

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  company: companySchema,
  subject: subjectSchema,
  message: messageSchema
})

export const newsletterSchema = z.object({
  email: emailSchema,
  name: nameSchema.optional()
})

export const bookingSchema = z.object({
  serviceId: z.string().cuid('Invalid service ID'),
  scheduledAt: futureDateSchema,
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  clientName: nameSchema,
  clientEmail: emailSchema,
  clientPhone: phoneSchema
})

export const serviceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters long').max(100),
  slug: slugSchema,
  description: z.string().min(50, 'Description must be at least 50 characters long').max(5000),
  shortDesc: z.string().max(200, 'Short description must be less than 200 characters').optional(),
  features: z.array(z.string().min(1).max(100)).max(20, 'Maximum 20 features allowed'),
  price: priceSchema,
  duration: durationSchema,
  category: z.string().max(50).optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  image: z.string().url('Invalid image URL').optional()
})

export const postSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  content: contentSchema,
  excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  coverImage: z.string().url('Invalid image URL').optional(),
  seoTitle: z.string().max(60, 'SEO title must be less than 60 characters').optional(),
  seoDescription: z.string().max(160, 'SEO description must be less than 160 characters').optional(),
  tags: z.array(z.string().min(1).max(30)).max(10, 'Maximum 10 tags allowed'),
  readTime: z.number().min(1).max(120).optional()
})

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}
