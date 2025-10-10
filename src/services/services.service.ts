import { createHash } from 'crypto'

import { Prisma, ServiceStatus, type Service as PrismaService } from '@prisma/client'

import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { NotificationService } from '@/lib/notification.service'
import { serviceEvents } from '@/lib/events/service-events'
import {
  generateSlug,
  sanitizeServiceData,
  validateSlugUniqueness,
} from '@/lib/services/utils'
import type {
  BulkAction,
  Service as ServiceType,
  ServiceAnalytics,
  ServiceFilters,
  ServiceFormData,
  ServiceStats,
} from '@/types/services'

import { resolveTenantId } from './tenant-utils'

interface ServiceSettingsUpdate {
  id: string
  settings: Record<string, unknown>
}

interface ExportOptions {
  format?: 'csv' | 'json'
  includeInactive?: boolean
}

function toPlainNumber(value: Prisma.Decimal | number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (value instanceof Prisma.Decimal) return Number(value)
  return Number(value)
}

function asDate(input: Date | string | null | undefined): Date | null {
  if (!input) return null
  if (input instanceof Date) return input
  const parsed = Date.parse(String(input))
  if (Number.isNaN(parsed)) return null
  return new Date(parsed)
}

export class ServicesService {
  constructor(
    private readonly cache: CacheService = new CacheService(),
    private readonly notifications: NotificationService = new NotificationService(),
  ) {}

  async cloneService(name: string, fromId: string): Promise<ServiceType> {
    const original = await prisma.service.findUnique({ where: { id: fromId } })
    if (!original) {
      throw new Error('Source service not found')
    }

    const tenantId = original.tenantId
    const baseName = name.trim() || `${original.name} (copy)`
    const baseSlug = generateSlug(baseName)
    let slug = baseSlug
    let suffix = 1

    while (
      await prisma.service.findFirst({
        where: {
          tenantId,
          slug,
        },
      })
    ) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    const created = await prisma.service.create({
      data: {
        tenant: { connect: { id: tenantId } },
        name: baseName,
        slug,
        description: original.description,
        shortDesc: original.shortDesc,
        features: [...original.features],
        price: original.price,
        basePrice: original.basePrice,
        duration: original.duration,
        estimatedDurationHours: original.estimatedDurationHours,
        category: original.category,
        featured: false,
        active: false,
        status: ServiceStatus.DRAFT,
        image: original.image,
        serviceSettings: original.serviceSettings ?? undefined,
        bookingEnabled: original.bookingEnabled,
        advanceBookingDays: original.advanceBookingDays,
        minAdvanceHours: original.minAdvanceHours,
        maxDailyBookings: original.maxDailyBookings,
        bufferTime: original.bufferTime,
        businessHours: original.businessHours,
        blackoutDates: [...original.blackoutDates],
        requiredSkills: [...original.requiredSkills],
      },
    })

    await this.clearCaches(tenantId)
    try {
      await this.notifications.notifyServiceCreated(this.toType(created), 'system')
    } catch {}
    try {
      serviceEvents.emit('service:created', {
        tenantId,
        service: { id: created.id, slug: created.slug, name: created.name },
      })
    } catch {}

    return this.toType(created)
  }

  async getServiceVersionHistory(_id: string): Promise<unknown[]> {
    return []
  }

  async validateServiceDependencies(service: Partial<ServiceType>): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []
    if (service.booking?.bookingEnabled) {
      const duration = service.duration ?? null
      if (!duration || duration <= 0) {
        issues.push('Booking enabled but duration is missing or invalid')
      }
    }
    if (typeof service.booking?.bufferTime === 'number' && service.booking.bufferTime < 0) {
      issues.push('bufferTime cannot be negative')
    }
    return { valid: issues.length === 0, issues }
  }

  async bulkUpdateServiceSettings(
    tenantId: string | null,
    updates: ServiceSettingsUpdate[],
  ): Promise<{ updated: number; errors: Array<{ id: string; error: string }> }> {
    if (!updates || updates.length === 0) {
      return { updated: 0, errors: [] }
    }

    const resolvedTenantId = resolveTenantId(tenantId)
    const serviceIds = updates.map((u) => u.id)

    const existing = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
      },
      select: { id: true, serviceSettings: true },
    })

    const existingMap = new Map(existing.map((item) => [item.id, item.serviceSettings ?? {}]))

    let updated = 0
    const errors: Array<{ id: string; error: string }> = []

    for (const update of updates) {
      try {
        if (!existingMap.has(update.id)) {
          errors.push({ id: update.id, error: 'Service not found' })
          continue
        }
        const merged = {
          ...(existingMap.get(update.id) as Record<string, unknown>),
          ...update.settings,
        }
        await prisma.service.update({
          where: { id: update.id },
          data: { serviceSettings: merged },
        })
        updated += 1
      } catch (error) {
        errors.push({ id: update.id, error: (error as Error).message })
      }
    }

    await this.clearCaches(resolvedTenantId)

    return { updated, errors }
  }

  async getServicesList(
    tenantId: string | null,
    filters: ServiceFilters & { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' },
  ): Promise<{ services: ServiceType[]; total: number; page: number; limit: number; totalPages: number }> {
    const resolvedTenantId = resolveTenantId(tenantId)

    const limit = Math.max(1, Math.min(200, Number(filters.limit ?? 20)))
    const offset = Math.max(0, Number(filters.offset ?? 0))
    const sortBy = filters.sortBy ?? 'updatedAt'
    const sortOrder: 'asc' | 'desc' = filters.sortOrder === 'asc' ? 'asc' : 'desc'

    const cacheKey = this.buildCacheKey('services:list', {
      tenantId: resolvedTenantId,
      ...filters,
      limit,
      offset,
      sortBy,
      sortOrder,
    })

    const cached = await this.cache.get<{
      services: ServiceType[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>(cacheKey)
    if (cached) {
      return cached
    }

    const where: Prisma.ServiceWhereInput = {}
    if (resolvedTenantId) {
      where.tenantId = resolvedTenantId
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        where.status = ServiceStatus.ACTIVE
      } else if (filters.status === 'inactive') {
        where.status = ServiceStatus.INACTIVE
      } else if (filters.status === 'draft') {
        where.status = ServiceStatus.DRAFT
      }
    }

    if (filters.featured === 'featured') {
      where.featured = true
    } else if (filters.featured === 'non-featured') {
      where.featured = false
    }

    if (filters.category && filters.category !== 'all') {
      where.category = filters.category
    }

    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (filters.minPrice != null || filters.maxPrice != null) {
      where.price = {}
      if (filters.minPrice != null) {
        where.price.gte = filters.minPrice
      }
      if (filters.maxPrice != null) {
        where.price.lte = filters.maxPrice
      }
    }

    const orderBy: Prisma.ServiceOrderByWithRelationInput = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'price') {
      orderBy.price = sortOrder
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder
    } else {
      orderBy.updatedAt = sortOrder
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({ where, orderBy, skip: offset, take: limit }),
      prisma.service.count({ where }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))
    const page = Math.floor(offset / limit) + 1

    const payload = {
      services: services.map((service) => this.toType(service)),
      total,
      page,
      limit,
      totalPages,
    }

    await this.cache.set(cacheKey, payload, 60)

    return payload
  }

  async getServiceById(tenantId: string | null, serviceId: string): Promise<ServiceType | null> {
    const resolvedTenantId = resolveTenantId(tenantId)
    const cacheKey = `services:detail:${this.tenantKey(resolvedTenantId)}:${serviceId}`

    const cached = await this.cache.get<ServiceType>(cacheKey)
    if (cached) {
      return cached
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
      },
    })

    if (!service) return null

    const mapped = this.toType(service)
    await this.cache.set(cacheKey, mapped, 300)
    return mapped
  }

  async createService(tenantId: string | null, data: ServiceFormData, createdBy: string): Promise<ServiceType> {
    const resolvedTenantId = resolveTenantId(tenantId)
    if (!resolvedTenantId) {
      throw new Error('Tenant context is required to create a service')
    }

    const sanitized = sanitizeServiceData(data)

    const name = sanitized.name ?? data.name
    if (!name || !name.trim()) {
      throw new Error('Service name is required')
    }

    const description = sanitized.description ?? data.description
    if (!description || !description.trim()) {
      throw new Error('Service description is required')
    }

    const slug = sanitized.slug ?? generateSlug(data.slug ?? data.name ?? name)
    await validateSlugUniqueness(slug, resolvedTenantId)

    const blackoutDates = (sanitized.blackoutDates ?? data.blackoutDates ?? []).map((value) => {
      const parsed = asDate(value)
      if (!parsed) {
        throw new Error('Invalid blackout date')
      }
      return parsed
    })

    const service = await prisma.service.create({
      data: {
        tenant: { connect: { id: resolvedTenantId } },
        name,
        slug,
        description,
        shortDesc: sanitized.shortDesc ?? data.shortDesc ?? null,
        features: sanitized.features ?? data.features ?? [],
        price: sanitized.price ?? data.price ?? null,
        basePrice: sanitized.basePrice ?? data.basePrice ?? null,
        duration: sanitized.duration ?? data.duration ?? null,
        estimatedDurationHours: sanitized.estimatedDurationHours ?? data.estimatedDurationHours ?? null,
        category: sanitized.category ?? data.category ?? null,
        featured: sanitized.featured ?? data.featured ?? false,
        active: sanitized.active ?? data.active ?? true,
        status: (sanitized.status ?? data.status ?? ServiceStatus.ACTIVE) as ServiceStatus,
        image: sanitized.image ?? data.image ?? null,
        serviceSettings: sanitized.serviceSettings ?? data.serviceSettings ?? undefined,
        bookingEnabled: sanitized.bookingEnabled ?? data.bookingEnabled ?? true,
        advanceBookingDays: sanitized.advanceBookingDays ?? data.advanceBookingDays ?? 30,
        minAdvanceHours: sanitized.minAdvanceHours ?? data.minAdvanceHours ?? 24,
        maxDailyBookings: sanitized.maxDailyBookings ?? data.maxDailyBookings ?? null,
        bufferTime: sanitized.bufferTime ?? data.bufferTime ?? 0,
        businessHours: sanitized.businessHours ?? data.businessHours ?? null,
        blackoutDates,
        requiredSkills: sanitized.requiredSkills ?? data.requiredSkills ?? [],
      },
    })

    const mapped = this.toType(service)

    await this.clearCaches(resolvedTenantId)
    try {
      await this.notifications.notifyServiceCreated(mapped, createdBy)
    } catch {}
    try {
      serviceEvents.emit('service:created', {
        tenantId: resolvedTenantId,
        service: { id: service.id, slug: service.slug, name: service.name },
      })
    } catch {}

    return mapped
  }

  async updateService(
    tenantId: string | null,
    id: string,
    data: Partial<ServiceFormData>,
    updatedBy: string,
  ): Promise<ServiceType> {
    const resolvedTenantId = resolveTenantId(tenantId)

    const current = await prisma.service.findFirst({
      where: {
        id,
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
      },
    })

    if (!current) {
      throw new Error('Service not found')
    }

    const sanitized = sanitizeServiceData(data)

    if (sanitized.slug && sanitized.slug !== current.slug) {
      await validateSlugUniqueness(sanitized.slug, resolvedTenantId, id)
    }

    if (sanitized.blackoutDates) {
      sanitized.blackoutDates = sanitized.blackoutDates.map((value) => {
        const parsed = asDate(value)
        if (!parsed) {
          throw new Error('Invalid blackout date')
        }
        return parsed.toISOString()
      })
    }

    const updateData: Prisma.ServiceUpdateInput = {
      ...this.pickDefined({
        name: sanitized.name,
        slug: sanitized.slug,
        description: sanitized.description,
        shortDesc: sanitized.shortDesc ?? null,
        features: sanitized.features,
        price: sanitized.price,
        basePrice: sanitized.basePrice,
        duration: sanitized.duration,
        estimatedDurationHours: sanitized.estimatedDurationHours,
        category: sanitized.category,
        featured: sanitized.featured,
        active: sanitized.active,
        status: sanitized.status ? (sanitized.status as ServiceStatus) : undefined,
        image: sanitized.image ?? null,
        serviceSettings: sanitized.serviceSettings ?? undefined,
        bookingEnabled: sanitized.bookingEnabled,
        advanceBookingDays: sanitized.advanceBookingDays,
        minAdvanceHours: sanitized.minAdvanceHours,
        maxDailyBookings: sanitized.maxDailyBookings,
        bufferTime: sanitized.bufferTime,
        businessHours: sanitized.businessHours ?? undefined,
        blackoutDates: sanitized.blackoutDates ? sanitized.blackoutDates.map((d) => new Date(d)) : undefined,
        requiredSkills: sanitized.requiredSkills,
      }),
    }

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
    })

    const mapped = this.toType(updated)
    await this.clearCaches(resolvedTenantId, id)

    try {
      const changes = this.detectChanges(current, updated)
      if (changes.length) {
        await this.notifications.notifyServiceUpdated(mapped, changes, updatedBy)
      }
    } catch {}

    try {
      serviceEvents.emit('service:updated', {
        tenantId: resolvedTenantId,
        service: { id: updated.id, slug: updated.slug, name: updated.name },
      })
    } catch {}

    return mapped
  }

  async deleteService(tenantId: string | null, id: string, deletedBy: string): Promise<void> {
    const resolvedTenantId = resolveTenantId(tenantId)

    const existing = await prisma.service.findFirst({
      where: {
        id,
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
      },
    })

    if (!existing) {
      throw new Error('Service not found')
    }

    await prisma.service.update({
      where: { id },
      data: { active: false, status: ServiceStatus.INACTIVE },
    })

    await this.clearCaches(resolvedTenantId, id)

    try {
      await this.notifications.notifyServiceDeleted(this.toType(existing), deletedBy)
    } catch {}
    try {
      serviceEvents.emit('service:deleted', { tenantId: resolvedTenantId, id })
    } catch {}
  }

  async performBulkAction(
    tenantId: string | null,
    action: BulkAction,
    actor: string,
  ): Promise<{
    updatedCount: number
    errors: Array<{ id: string; error: string }>
    createdIds?: string[]
    rollback?: { rolledBack: boolean; errors?: string[] }
  }> {
    const resolvedTenantId = resolveTenantId(tenantId)
    const { action: type, serviceIds, value } = action

    if (!serviceIds || serviceIds.length === 0) {
      return { updatedCount: 0, errors: [{ id: '', error: 'No services selected' }] }
    }

    const where: Prisma.ServiceWhereInput = {
      id: { in: serviceIds },
      ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
    }

    if (type === 'activate' || type === 'deactivate') {
      const active = type === 'activate'
      const result = await prisma.service.updateMany({
        where,
        data: { active, status: active ? ServiceStatus.ACTIVE : ServiceStatus.INACTIVE },
      })
      await this.finishBulkAction(resolvedTenantId, type, result.count, actor)
      return { updatedCount: result.count, errors: [] }
    }

    if (type === 'feature' || type === 'unfeature') {
      const featured = type === 'feature'
      const result = await prisma.service.updateMany({ where, data: { featured } })
      await this.finishBulkAction(resolvedTenantId, type, result.count, actor)
      return { updatedCount: result.count, errors: [] }
    }

    if (type === 'category') {
      const category = typeof value === 'string' ? value.trim() : ''
      if (!category) {
        return { updatedCount: 0, errors: serviceIds.map((id) => ({ id, error: 'Category is required' })) }
      }
      const result = await prisma.service.updateMany({ where, data: { category } })
      await this.finishBulkAction(resolvedTenantId, type, result.count, actor)
      return { updatedCount: result.count, errors: [] }
    }

    if (type === 'price-update') {
      const price = Number(value)
      if (!Number.isFinite(price) || price < 0) {
        return { updatedCount: 0, errors: serviceIds.map((id) => ({ id, error: 'Valid price required' })) }
      }
      const result = await prisma.service.updateMany({ where, data: { price } })
      await this.finishBulkAction(resolvedTenantId, type, result.count, actor)
      return { updatedCount: result.count, errors: [] }
    }

    if (type === 'delete') {
      const result = await prisma.service.updateMany({
        where,
        data: { active: false, status: ServiceStatus.INACTIVE },
      })
      await this.finishBulkAction(resolvedTenantId, type, result.count, actor)
      return { updatedCount: result.count, errors: [] }
    }

    if (type === 'clone') {
      const errors: Array<{ id: string; error: string }> = []
      const createdIds: string[] = []

      let settingsAllowClone = true
      try {
        const mod = await import('@/services/services-settings.service')
        const svc = mod.default
        const settings = await svc.get(resolvedTenantId)
        settingsAllowClone = Boolean(settings?.services?.allowCloning ?? true)
      } catch {}

      if (!settingsAllowClone) {
        return {
          updatedCount: 0,
          errors: serviceIds.map((id) => ({ id, error: 'Cloning disabled by settings' })),
        }
      }

      for (const id of serviceIds) {
        try {
          const original = await prisma.service.findFirst({
            where: { id, ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}) },
          })
          if (!original) {
            errors.push({ id, error: 'Source service not found' })
            continue
          }
          const cloneName = typeof value === 'string' && value.trim() ? value.trim() : `${original.name} (copy)`
          const created = await this.cloneService(cloneName, id)
          createdIds.push(created.id)
        } catch (error) {
          errors.push({ id, error: (error as Error).message })
        }
      }

      let rollback: { rolledBack: boolean; errors?: string[] } | undefined
      if (errors.length && createdIds.length) {
        const rollbackErrors: string[] = []
        for (const createdId of createdIds) {
          try {
            await prisma.service.delete({ where: { id: createdId } })
          } catch (error) {
            rollbackErrors.push(`${createdId}: ${(error as Error).message}`)
          }
        }
        rollback = {
          rolledBack: rollbackErrors.length === 0,
          errors: rollbackErrors.length ? rollbackErrors : undefined,
        }
      }

      if (createdIds.length) {
        await this.finishBulkAction(resolvedTenantId, type, createdIds.length, actor)
      } else {
        await this.clearCaches(resolvedTenantId)
      }

      return { updatedCount: createdIds.length, errors, createdIds, rollback }
    }

    if (type === 'settings-update') {
      if (!value || typeof value !== 'object') {
        return {
          updatedCount: 0,
          errors: serviceIds.map((id) => ({ id, error: 'Invalid settings payload' })),
        }
      }
      const updates = serviceIds.map((id) => ({ id, settings: value as Record<string, unknown> }))
      const result = await this.bulkUpdateServiceSettings(resolvedTenantId, updates)
      await this.finishBulkAction(resolvedTenantId, type, result.updated, actor)
      return { updatedCount: result.updated, errors: result.errors }
    }

    return {
      updatedCount: 0,
      errors: serviceIds.map((id) => ({ id, error: 'Unknown bulk action' })),
    }
  }

  async getServiceStats(
    tenantId: string | null,
    _range: string = '30d',
  ): Promise<ServiceStats & { analytics: ServiceAnalytics }> {
    const resolvedTenantId = resolveTenantId(tenantId)
    const cacheKey = `services:stats:${this.tenantKey(resolvedTenantId)}`
    const cached = await this.cache.get<ServiceStats & { analytics: ServiceAnalytics }>(cacheKey)
    if (cached) {
      return cached
    }

    const where: Prisma.ServiceWhereInput = resolvedTenantId ? { tenantId: resolvedTenantId } : {}

    const [total, active, featured, categories, aggregates] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.count({ where: { ...where, status: ServiceStatus.ACTIVE } }),
      prisma.service.count({ where: { ...where, featured: true, status: ServiceStatus.ACTIVE } }),
      prisma.service.groupBy({
        by: ['category'],
        where: { ...where, category: { not: null } },
      }),
      prisma.service.aggregate({
        where,
        _avg: { price: true },
        _sum: { price: true },
      }),
    ])

    const bookings = await prisma.booking.findMany({
      where: {
        ...(resolvedTenantId
          ? { service: { tenantId: resolvedTenantId } }
          : {}),
      },
      select: {
        id: true,
        scheduledAt: true,
        serviceId: true,
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    })

    const views = await prisma.serviceView.groupBy({
      by: ['serviceId'],
      where: {
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
      },
      _count: { _all: true },
    })

    const serviceNameMap = new Map<string, string>()
    const revenueByService = new Map<string, number>()
    const bookingsByService = new Map<string, number>()
    const monthlyRevenue = new Map<string, Map<string, number>>()
    const monthlyBookings = new Map<string, number>()

    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    for (const booking of bookings) {
      if (!booking.service) continue
      const price = toPlainNumber(booking.service.price) ?? 0
      const serviceId = booking.serviceId
      const serviceName = booking.service.name

      serviceNameMap.set(serviceId, serviceName)

      revenueByService.set(serviceId, (revenueByService.get(serviceId) ?? 0) + price)
      bookingsByService.set(serviceId, (bookingsByService.get(serviceId) ?? 0) + 1)

      const scheduledAt = asDate(booking.scheduledAt)
      if (!scheduledAt) continue
      if (scheduledAt < sixMonthsAgo) continue

      const monthKey = `${scheduledAt.getFullYear()}-${String(scheduledAt.getMonth() + 1).padStart(2, '0')}`
      monthlyBookings.set(monthKey, (monthlyBookings.get(monthKey) ?? 0) + 1)

      if (!monthlyRevenue.has(serviceId)) {
        monthlyRevenue.set(serviceId, new Map())
      }
      const revenueForService = monthlyRevenue.get(serviceId)!
      revenueForService.set(monthKey, (revenueForService.get(monthKey) ?? 0) + price)
    }

    const viewsByService = new Map<string, number>()
    for (const view of views) {
      viewsByService.set(view.serviceId, view._count._all)
    }

    const analytics: ServiceAnalytics = {
      monthlyBookings: Array.from(monthlyBookings.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([month, count]) => ({ month, bookings: count })),
      revenueByService: Array.from(revenueByService.entries())
        .map(([serviceId, revenue]) => ({
          service: serviceNameMap.get(serviceId) ?? serviceId,
          revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue),
      popularServices: Array.from(bookingsByService.entries())
        .map(([serviceId, count]) => ({
          service: serviceNameMap.get(serviceId) ?? serviceId,
          bookings: count,
        }))
        .sort((a, b) => b.bookings - a.bookings),
      conversionRates: Array.from(bookingsByService.entries()).map(([serviceId, bookingsCount]) => {
        const viewsCount = viewsByService.get(serviceId) ?? 0
        const rate = viewsCount === 0 ? 0 : bookingsCount / viewsCount
        return {
          service: serviceNameMap.get(serviceId) ?? serviceId,
          rate,
        }
      }),
      revenueTimeSeries: Array.from(monthlyRevenue.entries()).map(([serviceId, monthly]) => ({
        service: serviceNameMap.get(serviceId) ?? serviceId,
        monthly: Array.from(monthly.entries())
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([month, revenue]) => ({ month, revenue })),
      })),
      conversionsByService: Array.from(bookingsByService.entries()).map(([serviceId, bookingsCount]) => {
        const viewsCount = viewsByService.get(serviceId) ?? 0
        return {
          service: serviceNameMap.get(serviceId) ?? serviceId,
          bookings: bookingsCount,
          views: viewsCount,
          conversionRate: viewsCount === 0 ? 0 : bookingsCount / viewsCount,
        }
      }),
      viewsByService: Array.from(viewsByService.entries()).map(([serviceId, count]) => ({
        service: serviceNameMap.get(serviceId) ?? serviceId,
        views: count,
      })),
    }

    const result: ServiceStats & { analytics: ServiceAnalytics } = {
      total,
      active,
      featured,
      categories: categories.length,
      averagePrice: toPlainNumber(aggregates._avg.price) ?? 0,
      totalRevenue: toPlainNumber(aggregates._sum.price) ?? 0,
      analytics,
    }

    await this.cache.set(cacheKey, result, 300)
    return result
  }

  async exportServices(
    tenantId: string | null,
    options: ExportOptions = {},
  ): Promise<string> {
    const resolvedTenantId = resolveTenantId(tenantId)
    const format = options.format ?? 'csv'
    const includeInactive = options.includeInactive ?? false

    const where: Prisma.ServiceWhereInput = {
      ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
      ...(includeInactive
        ? {}
        : { status: ServiceStatus.ACTIVE, active: true }),
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    if (format === 'json') {
      return JSON.stringify(services.map((service) => this.toType(service)), null, 2)
    }

    const headers = [
      'Name',
      'Slug',
      'Category',
      'Price',
      'Duration',
      'Featured',
      'Active',
      'Status',
      'Created At',
      'Updated At',
    ]

    const rows = services.map((service) => {
      const mapped = this.toType(service)
      return [
        mapped.name,
        mapped.slug,
        mapped.category ?? '',
        mapped.price == null ? '' : String(mapped.price),
        mapped.duration == null ? '' : String(mapped.duration),
        mapped.featured ? 'true' : 'false',
        mapped.active ? 'true' : 'false',
        mapped.status ?? '',
        mapped.createdAt,
        mapped.updatedAt,
      ]
        .map((value) => this.escapeCsv(value))
        .join(',')
    })

    return [headers.map((value) => this.escapeCsv(value)).join(','), ...rows].join('\n')
  }

  private async finishBulkAction(tenantId: string | null, action: string, count: number, actor: string) {
    await this.clearCaches(tenantId)
    if (count > 0) {
      try {
        await this.notifications.notifyBulkAction(action, count, actor)
      } catch {}
      try {
        serviceEvents.emit('service:bulk', { tenantId, action, count })
      } catch {}
    }
  }

  private pickDefined<T extends object>(input: T): T {
    return Object.entries(input).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        ;(acc as any)[key] = value
      }
      return acc
    }, {} as T)
  }

  private detectChanges(previous: any, next: any): string[] {
    const changed: string[] = []
    const keys = new Set<string>([...Object.keys(previous ?? {}), ...Object.keys(next ?? {})])
    for (const key of keys) {
      const prev = previous?.[key]
      const curr = next?.[key]
      if (JSON.stringify(prev) !== JSON.stringify(curr)) {
        changed.push(key)
      }
    }
    return changed
  }

  private toType(service: Prisma.ServiceGetPayload<{ }>): ServiceType {
    return {
      id: service.id,
      tenantId: service.tenantId,
      slug: service.slug,
      name: service.name,
      description: service.description,
      shortDesc: service.shortDesc ?? null,
      features: Array.isArray(service.features) ? service.features : [],
      category: service.category ?? null,
      price: toPlainNumber(service.price),
      basePrice: toPlainNumber(service.basePrice),
      duration: service.duration ?? null,
      estimatedDurationHours: service.estimatedDurationHours ?? null,
      requiredSkills: Array.isArray(service.requiredSkills) ? service.requiredSkills : [],
      featured: Boolean(service.featured),
      active: Boolean(service.active),
      status: service.status,
      serviceSettings: (service.serviceSettings as Record<string, unknown> | null) ?? null,
      metrics: undefined,
      views: service.views ?? undefined,
      image: service.image ?? null,
      createdAt: (service.createdAt instanceof Date ? service.createdAt.toISOString() : String(service.createdAt)) ?? new Date().toISOString(),
      updatedAt: (service.updatedAt instanceof Date ? service.updatedAt.toISOString() : String(service.updatedAt)) ?? new Date().toISOString(),
      booking: {
        bookingEnabled: Boolean(service.bookingEnabled),
        advanceBookingDays: service.advanceBookingDays ?? undefined,
        minAdvanceHours: service.minAdvanceHours ?? undefined,
        maxDailyBookings: service.maxDailyBookings ?? undefined,
        bufferTime: service.bufferTime ?? undefined,
        businessHours: (service.businessHours as Record<string, unknown> | null) ?? null,
        blackoutDates: (service.blackoutDates ?? []).map((value) => (value instanceof Date ? value.toISOString() : String(value))),
      },
      currency: null,
      priceCents: undefined,
    } as ServiceType
  }

  private async clearCaches(tenantId: string | null, serviceId?: string) {
    const tenantKey = this.tenantKey(tenantId)
    try {
      await this.cache.deletePattern?.(`services:list:${tenantKey}:*`)
    } catch {}
    if (serviceId) {
      try {
        await this.cache.delete?.(`services:detail:${tenantKey}:${serviceId}`)
      } catch {}
    }
    try {
      await this.cache.delete?.(`services:stats:${tenantKey}`)
    } catch {}
  }

  private tenantKey(tenantId: string | null): string {
    return tenantId ?? 'global'
  }

  private buildCacheKey(prefix: string, payload: Record<string, unknown>): string {
    const json = JSON.stringify(payload, Object.keys(payload).sort())
    const hash = createHash('sha1').update(json).digest('hex')
    return `${prefix}:${hash}`
  }

  private escapeCsv(value: string | number | null | undefined): string {
    const str = value == null ? '' : String(value)
    if (str.includes(',') || str.includes('"') || /\s/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
}

const servicesService = new ServicesService()
export default servicesService
