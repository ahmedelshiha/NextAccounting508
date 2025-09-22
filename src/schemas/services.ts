import { z } from 'zod';

// Image URL: accept empty/undefined, otherwise must be valid http/https URL
const ImageUrlSchema = z.preprocess((v) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? undefined : s
}, z.string()
  .url('Invalid image URL')
  .refine((u) => {
    try { const p = new URL(u).protocol; return p === 'http:' || p === 'https:' } catch { return false }
  }, { message: 'Invalid image URL' }))

export const ServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Name too long'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  shortDesc: z.string().max(200, 'Short description too long').optional(),
  features: z.array(z.string()).max(20, 'Too many features'),
  price: z.number().min(0, 'Price must be positive').max(999999, 'Price too high').nullable().optional(),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours').nullable().optional(),
  category: z.string().max(50, 'Category name too long').optional(),
  featured: z.boolean(),
  active: z.boolean(),
  image: ImageUrlSchema.optional(),
});

export const ServiceUpdateSchema = ServiceSchema.partial().extend({
  id: z.string().min(1, 'Service ID is required'),
});

export const BulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'feature', 'unfeature', 'delete', 'category', 'price-update']),
  serviceIds: z.array(z.string()).min(1, 'At least one service must be selected'),
  value: z.union([z.string(), z.number()]).optional(),
});

export const ServiceFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  featured: z.enum(['all', 'featured', 'non-featured']).optional(),
  status: z.enum(['all', 'active', 'inactive']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'price']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const ServiceListResponseSchema = z.object({
  services: z.array(ServiceSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const ServiceStatsResponseSchema = z.object({
  total: z.number(),
  active: z.number(),
  featured: z.number(),
  categories: z.number(),
  averagePrice: z.number(),
  totalRevenue: z.number(),
});
