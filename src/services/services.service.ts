import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

import type { Service as ServiceType, ServiceFormData, ServiceFilters, ServiceStats, ServiceAnalytics, BulkAction } from '@/types/services';
import { validateSlugUniqueness, generateSlug, sanitizeServiceData, filterServices, sortServices } from '@/lib/services/utils';
import { CacheService } from '@/lib/cache.service';
import { NotificationService } from '@/lib/notification.service';

export class ServicesService {
  constructor(
    private cache: CacheService = new CacheService(),
    private notifications: NotificationService = new NotificationService()
  ) {}

  /**
   * Clone an existing service into a new one with a provided name.
   * - Generates a unique, tenant-scoped slug
   * - Sets featured=false, active=false, status=DRAFT
   * - Copies pricing, duration, category, features, image and settings
   */
  async cloneService(name: string, fromId: string): Promise<ServiceType> {
    const src = await prisma.service.findUnique({ where: { id: fromId } })
    if (!src) throw new Error('Source service not found')

    const tenantId: string | null = (src as any).tenantId ?? null
    const baseSlug = generateSlug(name)

    // Ensure tenant-scoped slug uniqueness
    let slug = baseSlug || `service-${Date.now()}`
    let attempt = 1
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await prisma.service.findFirst({ where: { slug, ...(tenantId ? { tenantId } : {}) } as any })
      if (!exists) break
      attempt += 1
      slug = `${baseSlug}-${attempt}`
    }

    const created = await prisma.service.create({
      data: {
        name,
        slug,
        description: src.description,
        shortDesc: src.shortDesc ?? null,
        features: Array.isArray(src.features) ? src.features : [],
        price: src.price as any,
        duration: src.duration as any,
        category: src.category ?? null,
        featured: false,
        active: false,
        status: 'DRAFT' as any,
        image: (src as any).image ?? null,
        serviceSettings: (src as any).serviceSettings ?? undefined,
        ...(tenantId ? { tenantId } : {}),
      },
    })

    await this.clearCaches(tenantId)
    try { await this.notifications.notifyServiceCreated(created as any, 'system') } catch {}
    return this.toType(created as any)
  }

  /**
   * Returns version history for a service. Placeholder for future implementation.
   */
  async getServiceVersionHistory(_id: string): Promise<any[]> {
    return []
  }

  /**
   * Basic dependency validation for a service. Returns issues found.
   */
  async validateServiceDependencies(service: Partial<ServiceType> | any): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []
    const bookingEnabled = (service as any).bookingEnabled
    const duration = (service as any).duration
    const bufferTime = (service as any).bufferTime

    if (bookingEnabled === true) {
      const d = typeof duration === 'number' ? duration : null
      if (d == null || d <= 0) issues.push('Booking enabled but duration is missing or invalid')
    }
    if (bufferTime != null && typeof bufferTime === 'number' && bufferTime < 0) {
      issues.push('bufferTime cannot be negative')
    }
    const valid = issues.length === 0
    return { valid, issues }
  }

  /**
   * Bulk update serviceSettings with shallow merge per service.
   */
  async bulkUpdateServiceSettings(
    tenantId: string | null,
    updates: Array<{ id: string; settings: Record<string, any> }>
  ): Promise<{ updated: number; errors: Array<{ id: string; error: string }> }> {
    if (!updates || updates.length === 0) return { updated: 0, errors: [] }
    const ids = updates.map(u => u.id)

    const existing = await prisma.service.findMany({ where: { id: { in: ids }, ...(tenantId ? { tenantId } : {}) } as any, select: { id: true, serviceSettings: true } })
    const map = new Map(existing.map(e => [e.id, e]))

    let updated = 0
    const errors: Array<{ id: string; error: string }> = []

    for (const u of updates) {
      try {
        const before = map.get(u.id)
        const prev = (before?.serviceSettings as any) ?? {}
        const next = { ...prev, ...u.settings }
        await prisma.service.update({ where: { id: u.id }, data: { serviceSettings: next as any } })
        updated += 1
      } catch (e: any) {
        errors.push({ id: u.id, error: String(e?.message || 'Failed to update settings') })
      }
    }

    await this.clearCaches(tenantId)
    return { updated, errors }
  }

  async getServicesList(
    tenantId: string | null,
    filters: ServiceFilters & { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ services: ServiceType[]; total: number; page: number; limit: number; totalPages: number; }> {
    const { search, category, featured, status, limit = 20, offset = 0, sortBy = 'updatedAt', sortOrder = 'desc' } = filters;

    const where: Prisma.ServiceWhereInput = { ...(tenantId ? { tenantId } : {}), };
    if (status === 'active') (where as any).status = 'ACTIVE';
    else if (status === 'inactive') (where as any).status = { not: 'ACTIVE' } as any;
    if (featured === 'featured') (where as any).featured = true; else if (featured === 'non-featured') (where as any).featured = false;
    if (category && category !== 'all') (where as any).category = category;
    if (search) {
      (where as any).OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ServiceOrderByWithRelationInput = {};
    if (sortBy === 'name') (orderBy as any).name = sortOrder;
    else if (sortBy === 'price') (orderBy as any).price = sortOrder;
    else if (sortBy === 'createdAt') (orderBy as any).createdAt = sortOrder;
    else (orderBy as any).updatedAt = sortOrder;

    try {
      const [rows, total] = await Promise.all([
        prisma.service.findMany({ where, orderBy, skip: offset, take: limit }),
        prisma.service.count({ where }),
      ]);
      const totalPages = Math.ceil(total / limit);
      const page = Math.floor(offset / limit) + 1;
      return { services: rows.map(this.toType), total, page, limit, totalPages };
    } catch (e) {
      // Schema mismatch fallback: query raw rows and filter/sort/paginate in memory
      const all = await prisma.$queryRawUnsafe<any[]>(
        'SELECT "id","slug","name","description","shortDesc","price","duration","category","featured","active","status","image","createdAt","updatedAt" FROM "services"'
      );
      let items = all.map(this.toType);
      // Apply basic filters client-side
      const basicFilters: any = { search, category, featured, status };
      items = filterServices(items as any[], basicFilters) as any;
      // Sort client-side
      const safeSortBy = ['name','createdAt','updatedAt','price'].includes(sortBy) ? sortBy : 'updatedAt';
      items = sortServices(items as any, safeSortBy, sortOrder) as any;
      const total = items.length;
      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const paged = items.slice(offset, offset + limit);
      return { services: paged, total, page, limit, totalPages };
    }
  }

  async getServiceById(tenantId: string | null, serviceId: string): Promise<ServiceType | null> {
    const cacheKey = `service:${serviceId}:${tenantId}`;
    const cached = await this.cache.get<ServiceType>(cacheKey);
    if (cached) return cached;

    const s = await prisma.service.findFirst({ where: { id: serviceId, ...(tenantId ? { tenantId } : {}) } });
    if (!s) return null;
    const t = this.toType(s as any);
    await this.cache.set(cacheKey, t, 300);
    return t;
  }

  async createService(tenantId: string | null, data: ServiceFormData, createdBy: string): Promise<ServiceType> {
    const sanitized = sanitizeServiceData(data) as ServiceFormData;
    if (!sanitized.slug) sanitized.slug = generateSlug(sanitized.name);
    await validateSlugUniqueness(sanitized.slug, tenantId);

    const isActive = sanitized.active ?? true;
    const s = await prisma.service.create({ data: { ...sanitized, ...(tenantId ? { tenantId } : {}), active: isActive, status: (isActive ? 'ACTIVE' : 'INACTIVE') as any } });
    await this.clearCaches(tenantId);
    await this.notifications.notifyServiceCreated(s, createdBy);
    return this.toType(s as any);
  }

  async updateService(tenantId: string | null, id: string, data: Partial<ServiceFormData>, updatedBy: string): Promise<ServiceType> {
    const existing = await this.getServiceById(tenantId, id);
    if (!existing) throw new Error('Service not found');

    const sanitized = sanitizeServiceData(data);
    if (sanitized.slug && sanitized.slug !== existing.slug) await validateSlugUniqueness(sanitized.slug, tenantId, id);

    const updateData: any = { ...sanitized };
    if (Object.prototype.hasOwnProperty.call(sanitized, 'active')) {
      updateData.status = (sanitized as any).active ? ('ACTIVE' as any) : ('INACTIVE' as any);
    }
    const s = await prisma.service.update({ where: { id }, data: updateData });
    await this.clearCaches(tenantId, id);
    const changes = this.detectChanges(existing, sanitized);
    if (changes.length) await this.notifications.notifyServiceUpdated(s, changes, updatedBy);
    return this.toType(s as any);
  }

  async deleteService(tenantId: string | null, id: string, deletedBy: string): Promise<void> {
    const existing = await this.getServiceById(tenantId, id);
    if (!existing) throw new Error('Service not found');

    await prisma.service.update({ where: { id }, data: { active: false, status: 'INACTIVE' as any } });
    await this.clearCaches(tenantId, id);
    await this.notifications.notifyServiceDeleted(existing, deletedBy);
  }

  async performBulkAction(tenantId: string | null, action: BulkAction, by: string): Promise<{ updatedCount: number; errors: Array<{ id: string; error: string }>; createdIds?: string[]; rollback?: { rolledBack: boolean; errors?: string[] } }> {
    const { action: type, serviceIds, value } = action;
    const where: Prisma.ServiceWhereInput = { id: { in: serviceIds } } as any;
    if (tenantId) (where as any).tenantId = tenantId;

    // Simple update actions
    if (['activate','deactivate','feature','unfeature','category','price-update'].includes(type)) {
      let data: any = {};
      if (type === 'activate') { data.active = true; data.status = 'ACTIVE' as any; }
      else if (type === 'deactivate') { data.active = false; data.status = 'INACTIVE' as any; }
      else if (type === 'feature') data.featured = true;
      else if (type === 'unfeature') data.featured = false;
      else if (type === 'category') data.category = String(value || '') || null;
      else if (type === 'price-update') data.price = Number(value);

      const res = await prisma.service.updateMany({ where, data });
      await this.clearCaches(tenantId);
      if (res.count) await this.notifications.notifyBulkAction(type, res.count, by);
      return { updatedCount: res.count, errors: [] };
    }

    // Delete -> soft deactivate
    if (type === 'delete') {
      const res = await prisma.service.updateMany({ where, data: { active: false, status: 'INACTIVE' as any } });
      await this.clearCaches(tenantId);
      if (res.count) await this.notifications.notifyBulkAction(type, res.count, by);
      return { updatedCount: res.count, errors: [] };
    }

    // Clone -> create copies per serviceId, return created ids and per-item errors
    if (type === 'clone') {
      const createdIds: string[] = [];
      const errors: Array<{ id: string; error: string }> = [];
      for (const id of serviceIds) {
        try {
          const orig = await this.getServiceById(tenantId, id);
          if (!orig) { errors.push({ id, error: 'Source service not found' }); continue }
          const cloneName = value && typeof value === 'string' ? `${value}` : `${orig.name} (copy)`;
          const c = await this.cloneService(cloneName, id);
          createdIds.push(c.id);
        } catch (e: any) {
          errors.push({ id, error: String(e?.message || 'Failed to clone') });
        }
      }
      // If any errors and we created some clones, attempt best-effort rollback by deleting created clones
      let rollbackResult: { rolledBack: boolean; errors?: string[] } | undefined = undefined;
      if (errors.length && createdIds.length) {
        const rbErrors: string[] = [];
        for (const cid of createdIds) {
          try {
            // hard delete to clean up drafts created during clone
            await prisma.service.delete({ where: { id: cid } });
          } catch (err: any) {
            rbErrors.push(`${cid}: ${String(err?.message || 'rollback failed')}`);
          }
        }
        rollbackResult = { rolledBack: rbErrors.length === 0, errors: rbErrors.length ? rbErrors : undefined };
      }

      await this.clearCaches(tenantId);
      if (createdIds.length) await this.notifications.notifyBulkAction(type, createdIds.length, by);
      return { updatedCount: createdIds.length, errors, createdIds, rollback: rollbackResult };
    }

    // settings-update -> value expected to be an object of settings to shallow-merge
    if (type === 'settings-update') {
      if (!value || typeof value !== 'object') return { updatedCount: 0, errors: serviceIds.map(id => ({ id, error: 'Invalid settings payload' })) };
      const updates = serviceIds.map(id => ({ id, settings: value as Record<string, any> }));
      const res = await this.bulkUpdateServiceSettings(tenantId, updates);
      await this.clearCaches(tenantId);
      if (res.updated) await this.notifications.notifyBulkAction(type, res.updated, by);
      // Map errors into expected shape
      const errors = res.errors || [];
      return { updatedCount: res.updated, errors };
    }

    return { updatedCount: 0, errors: serviceIds.map(id => ({ id, error: 'Unknown bulk action' })) };
  }

  async getServiceStats(tenantId: string | null, _range: string = '30d'): Promise<ServiceStats & { analytics: ServiceAnalytics }> {
    const cacheKey = `service-stats:${tenantId}:30d`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const where: Prisma.ServiceWhereInput = tenantId ? ({ tenantId } as any) : {};
    const [total, active, featured, catGroups, priceAgg] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.count({ where: { ...where, status: 'ACTIVE' as any } }),
      prisma.service.count({ where: { ...where, featured: true, status: 'ACTIVE' as any } }),
      prisma.service.groupBy({ by: ['category'], where: { ...where, status: 'ACTIVE' as any, category: { not: null } } as any }),
      prisma.service.aggregate({ where: { ...where, status: 'ACTIVE' as any, price: { not: null } } as any, _avg: { price: true }, _sum: { price: true } }),
    ]);

    // Analytics window: last 6 months
    const start = new Date();
    start.setMonth(start.getMonth() - 5);
    start.setDate(1);

    // Fetch bookings joined with service to compute revenue/popularity; filter by tenant if provided
    const bookingWhere: Prisma.BookingWhereInput = {
      scheduledAt: { gte: start },
      status: { in: ['COMPLETED','CONFIRMED'] as any },
      ...(tenantId ? ({ service: { tenantId } } as any) : {}),
    };

    let bookings: Array<{ id: string; scheduledAt: any; serviceId: string; service?: { id: string; name: string; price: any } }> = []
    try {
      if ((prisma as any)?.booking?.findMany) {
        bookings = await (prisma as any).booking.findMany({
          where: bookingWhere,
          select: { id: true, scheduledAt: true, serviceId: true, service: { select: { id: true, name: true, price: true } } },
        })
      }
    } catch { bookings = [] }

    // monthly bookings counts
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = (d: Date) => d.toLocaleString('en-US', { month: 'short' });
    const monthlyMap = new Map<string, number>();

    // revenue and popularity maps, plus per-service monthly revenue map
    const serviceMonthlyRevenue = new Map<string, Map<string, number>>();
    const serviceNames = new Map<string, string>();
    const serviceTotals = new Map<string, number>();
    const popularMap = new Map<string, { service: string; bookings: number }>();

    for (const b of bookings) {
      const d = new Date(b.scheduledAt as any);
      const key = monthKey(d);
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);

      const sid = b.serviceId || 'unknown';
      const name = b.service?.name || 'Unknown';
      const price = b.service?.price != null ? Number(b.service.price) : 0;

      serviceNames.set(sid, name);

      // per-service monthly revenue
      let m = serviceMonthlyRevenue.get(sid);
      if (!m) { m = new Map<string, number>(); serviceMonthlyRevenue.set(sid, m); }
      m.set(key, (m.get(key) || 0) + price);

      // totals
      serviceTotals.set(sid, (serviceTotals.get(sid) || 0) + price);

      // popularity
      const pop = popularMap.get(sid) || { service: name, bookings: 0 };
      pop.bookings += 1;
      popularMap.set(sid, pop);
    }

    // Generate last 6 months in order
    const monthlyBookings: { month: string; bookings: number }[] = [];
    const base = new Date(start);
    const monthKeys: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const key = monthKey(d);
      monthKeys.push(key);
      monthlyBookings.push({ month: monthLabel(d), bookings: monthlyMap.get(key) || 0 });
    }

    // revenue by service (sum of current service.price per booking)
    const revenueByServiceArr = Array.from(serviceTotals.entries()).map(([id, revenue]) => ({ id, service: serviceNames.get(id) || 'Unknown', revenue }));
    const revenueByService = revenueByServiceArr.sort((a,b) => b.revenue - a.revenue).slice(0, 10).map(r => ({ service: r.service, revenue: r.revenue }));

    const popularServices = Array.from(popularMap.values()).sort((a,b) => b.bookings - a.bookings).slice(0, 10);

    // revenue time-series for top services (top 5 by revenue)
    const topServiceIds = revenueByServiceArr.sort((a,b) => b.revenue - a.revenue).slice(0, 5).map(r => r.id);
    const revenueTimeSeries: { service: string; monthly: { month: string; revenue: number }[] }[] = topServiceIds.map(id => {
      const name = serviceNames.get(id) || 'Unknown';
      const perMonth = serviceMonthlyRevenue.get(id) || new Map();
      const monthly = monthKeys.map((k, idx) => ({ month: monthlyBookings[idx].month, revenue: perMonth.get(k) || 0 }));
      return { service: name, monthly };
    });

    // conversion rates per last 3 months (completed/total)
    const conv: { service: string; rate: number }[] = [];
    for (let i = 2; i >= 0; i--) {
      const from = new Date();
      from.setMonth(from.getMonth() - i);
      from.setDate(1);
      const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
      try {
        if ((prisma as any)?.booking?.count) {
          const [tot, done] = await Promise.all([
            (prisma as any).booking.count({ where: { ...bookingWhere, scheduledAt: { gte: from, lt: to } } }),
            (prisma as any).booking.count({ where: { ...bookingWhere, scheduledAt: { gte: from, lt: to }, status: 'COMPLETED' as any } }),
          ]);
          conv.push({ service: from.toLocaleString('en-US', { month: 'short' }), rate: tot ? (done / tot) * 100 : 0 });
        } else {
          conv.push({ service: from.toLocaleString('en-US', { month: 'short' }), rate: 0 });
        }
      } catch {
        conv.push({ service: from.toLocaleString('en-US', { month: 'short' }), rate: 0 });
      }
    }

    // Compute conversion from views -> bookings for top services using ServiceView aggregation
    const topIds = revenueByServiceArr.sort((a,b)=>b.revenue-a.revenue).slice(0,10).map(r=>r.id);
    let conversionsByService: { service: string; bookings: number; views: number; conversionRate: number }[] = [];
    if (topIds.length) {
      try {
        // Group views by serviceId within the analytics window (start..now)
        const viewGroups = await prisma.serviceView.groupBy({
          by: ['serviceId'],
          where: { serviceId: { in: topIds } as any, createdAt: { gte: start } },
          _count: { _all: true }
        });
        const viewMap = new Map<string, number>(viewGroups.map(v => [v.serviceId, v._count._all || 0]));

        const svcRows = await prisma.service.findMany({ where: { id: { in: topIds } as any }, select: { id: true, name: true } as any });
        for (const s of svcRows) {
          const bCount = serviceTotals.get(s.id) || 0; // revenue total treated as bookings? keep consistent — serviceTotals was revenue; use popularMap for bookings
          const bookingsCount = popularMap.get(s.id)?.bookings || 0;
          const vCount = viewMap.get(s.id) || 0;
          const rate = vCount > 0 ? (bookingsCount / vCount) * 100 : 0;
          conversionsByService.push({ service: s.name || 'Unknown', bookings: bookingsCount, views: vCount, conversionRate: Number(rate.toFixed(2)) });
        }
      } catch (err) {
        conversionsByService = [];
      }
    }

    const analytics: ServiceAnalytics = { monthlyBookings, revenueByService, popularServices, conversionRates: conv, revenueTimeSeries };
    analytics.conversionsByService = conversionsByService;
    const avgPriceVal = priceAgg && priceAgg._avg && priceAgg._avg.price != null ? Number(priceAgg._avg.price) : 0;
    const totalRevenueVal = priceAgg && priceAgg._sum && priceAgg._sum.price != null ? Number(priceAgg._sum.price) : 0;
    const stats: ServiceStats & { analytics: ServiceAnalytics } = { total, active, featured, categories: catGroups.length, averagePrice: avgPriceVal, totalRevenue: totalRevenueVal, analytics };
    await this.cache.set(cacheKey, stats, 600);
    return stats;
  }

  async exportServices(tenantId: string | null, options: { format: string; includeInactive?: boolean }): Promise<string> {
    const services = await prisma.service.findMany({ where: { ...(tenantId ? { tenantId } : {}), ...(options.includeInactive ? {} : ({ status: 'ACTIVE' } as any)) }, orderBy: { name: 'asc' } });
    if (options.format === 'json') return JSON.stringify(services, null, 2);
    const headers = ['ID','Name','Slug','Description','Short Description','Price','Duration','Category','Featured','Active','Created At','Updated At'];
    const rows = services.map(s => [s.id, `"${String(s.name).replace(/"/g,'""')}"`, s.slug, `"${String(s.description).replace(/"/g,'""')}"`, s.shortDesc ? `"${String(s.shortDesc).replace(/"/g,'""')}"` : '', s.price ?? '', s.duration ?? '', s.category ?? '', s.featured ? 'Yes' : 'No', ((s as any).status === 'ACTIVE' || (s as any).active === true) ? 'Yes' : 'No', s.createdAt.toISOString(), s.updatedAt.toISOString()]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  private toType(s: any): ServiceType {
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      shortDesc: s.shortDesc,
      features: s.features || [],
      price: s.price,
      duration: s.duration,
      category: s.category,
      featured: s.featured,
      active: (s.active !== undefined ? s.active : (s.status ? String(s.status).toUpperCase() === 'ACTIVE' : true)),
      image: s.image,
      createdAt: s.createdAt?.toISOString?.() || String(s.createdAt),
      updatedAt: s.updatedAt?.toISOString?.() || String(s.updatedAt),
      tenantId: s.tenantId,
    };
  }

  private async clearCaches(tenantId: string | null, serviceId?: string) {
    const patterns = [
      `service-stats:${tenantId}:*`,
      `services-list:${tenantId}:*`,
      `service:*:${tenantId}`,
    ];
    await Promise.all(patterns.map(p => this.cache.deletePattern(p)));
    if (serviceId) {
      const key = `service:${serviceId}:${tenantId}`;
      await this.cache.delete(key);
    }
  }

  private detectChanges(original: ServiceType, updates: Partial<ServiceFormData>): string[] {
    const c: string[] = [];
    if (updates.name && updates.name !== original.name) c.push('name');
    if (updates.price !== undefined && updates.price !== original.price) c.push('price');
    if (updates.active !== undefined && updates.active !== original.active) c.push('status');
    if (updates.featured !== undefined && updates.featured !== original.featured) c.push('featured');
    return c;
  }
}
