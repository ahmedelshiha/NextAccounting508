import { z } from 'zod'

const PageSchema = z.preprocess((v) => (typeof v === 'string' && v.length ? v : undefined), z.string().regex(/^\d+$/).transform((s) => Math.max(1, parseInt(s || '1', 10))).optional())
const LimitSchema = z.preprocess((v) => (typeof v === 'string' && v.length ? v : undefined), z.string().regex(/^\d+$/).transform((s) => Math.max(1, parseInt(s || '20', 10))).optional())
const SortOrderSchema = z.enum(['asc', 'desc']).optional()

export type ParsedListQuery = {
  page: number
  limit: number
  skip: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
  q?: string
}

export function parseListQuery(searchParams: URLSearchParams, opts: { allowedSortBy: string[]; defaultSortBy: string; maxLimit?: number }): ParsedListQuery {
  // Use safeParse to avoid throwing when params are missing or invalid
  const pageResult = PageSchema.safeParse(searchParams.get('page'))
  const page = pageResult.success ? (pageResult.data as number) : 1

  const limitResult = LimitSchema.safeParse(searchParams.get('limit'))
  const limitRaw = limitResult.success ? (limitResult.data as number) : 20

  const max = Math.max(1, opts.maxLimit ?? 100)
  const limit = Math.min(limitRaw, max)

  const offsetParam = searchParams.get('offset')
  const offsetNum = offsetParam != null ? Number(offsetParam) : NaN
  const skip = Number.isFinite(offsetNum) && offsetNum >= 0 ? Math.floor(offsetNum) : (page - 1) * limit

  const sortByParam = (searchParams.get('sortBy') || opts.defaultSortBy).toString()
  const sortBy = opts.allowedSortBy.includes(sortByParam) ? sortByParam : opts.defaultSortBy
  const sortOrderRaw = (searchParams.get('sortOrder') || 'desc').toLowerCase()
  const sortOrderResult = SortOrderSchema.safeParse(sortOrderRaw)
  const sortOrder = (sortOrderResult.success ? sortOrderResult.data : 'desc') as 'asc' | 'desc'

  const qValue = (searchParams.get('q') || '').trim()
  const q = qValue.length ? qValue : undefined

  return { page, limit, skip, sortBy, sortOrder, q }
}
