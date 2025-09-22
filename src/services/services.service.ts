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

  async getServicesList(
    tenantId: string | null,
    filters: ServiceFilters & { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ services: ServiceType[]; total: number; page: number; limit: number; totalPages: number; }> {
    const { search, category, featured, status, limit = 20, offset = 0, sortBy = 'updatedAt', sortOrder = 'desc' } = filters;

    const where: Prisma.ServiceWhereInput = { ...(tenantId ? { tenantId } : {}), };
    if (status === 'active') where.active = true; else if (status === 'inactive') where.active = false;
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
        'SELECT "id","slug","name","description","shortDesc","price","duration","category","featured","active","image","createdAt","updatedAt" FROM "services"'
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

    const s = await prisma.service.create({ data: { ...sanitized, ...(tenantId ? { tenantId } : {}), active: sanitized.active ?? true } });
    await this.clearCaches(tenantId);
    await this.notifications.notifyServiceCreated(s, createdBy);
    return this.toType(s as any);
  }

  async updateService(tenantId: string | null, id: string, data: Partial<ServiceFormData>, updatedBy: string): Promise<ServiceType> {
    const existing = await this.getServiceById(tenantId, id);
    if (!existing) throw new Error('Service not found');

    const sanitized = sanitizeServiceData(data);
    if (sanitized.slug && sanitized.slug !== existing.slug) await validateSlugUniqueness(sanitized.slug, tenantId, id);

    const s = await prisma.service.update({ where: { id }, data: { ...sanitized } });
    await this.clearCaches(tenantId, id);
    const changes = this.detectChanges(existing, sanitized);
    if (changes.length) await this.notifications.notifyServiceUpdated(s, changes, updatedBy);
    return this.toType(s as any);
  }

  async deleteService(tenantId: string | null, id: string, deletedBy: string): Promise<void> {
    const existing = await this.getServiceById(tenantId, id);
    if (!existing) throw new Error('Service not found');

    await prisma.service.update({ where: { id }, data: { active: false } });
    await this.clearCaches(tenantId, id);
    await this.notifications.notifyServiceDeleted(existing, deletedBy);
  }

  async performBulkAction(tenantId: string | null, action: BulkAction, by: string): Promise<{ updatedCount: number; errors: string[] }> {
    const { action: type, serviceIds, value } = action;
    const where: Prisma.ServiceWhereInput = { id: { in: serviceIds } } as any;
    if (tenantId) (where as any).tenantId = tenantId;

    let data: any = {};
    if (type === 'activate') data.active = true;
    else if (type === 'deactivate') data.active = false;
    else if (type === 'feature') data.featured = true;
    else if (type === 'unfeature') data.featured = false;
    else if (type === 'category') data.category = String(value || '') || null;
    else if (type === 'price-update') data.price = Number(value);

    if (type === 'delete') {
      const res = await prisma.service.updateMany({ where, data: { active: false } });
      await this.clearCaches(tenantId);
      if (res.count) await this.notifications.notifyBulkAction(type, res.count, by);
      return { updatedCount: res.count, errors: [] };
    }

    const res = await prisma.service.updateMany({ where, data });
    await this.clearCaches(tenantId);
    if (res.count) await this.notifications.notifyBulkAction(type, res.count, by);
    return { updatedCount: res.count, errors: [] };
  }

  async getServiceStats(tenantId: string | null, _range: string = '30d'): Promise<ServiceStats & { analytics: ServiceAnalytics }> {
    const cacheKey = `service-stats:${tenantId}:30d`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const where: Prisma.ServiceWhereInput = tenantId ? ({ tenantId } as any) : {};
    const [total, active, featured, catGroups, priceAgg] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.count({ where: { ...where, active: true } as any }),
      prisma.service.count({ where: { ...where, featured: true, active: true } as any }),
      prisma.service.groupBy({ by: ['category'], where: { ...where, active: true, category: { not: null } } as any }),
      prisma.service.aggregate({ where: { ...where, active: true, price: { not: null } } as any, _avg: { price: true }, _sum: { price: true } }),
    ]);

    const analytics: ServiceAnalytics = { monthlyBookings: [], revenueByService: [], popularServices: [], conversionRates: [] };
    const avgPriceVal = priceAgg && priceAgg._avg && priceAgg._avg.price != null ? Number(priceAgg._avg.price) : 0;
    const totalRevenueVal = priceAgg && priceAgg._sum && priceAgg._sum.price != null ? Number(priceAgg._sum.price) : 0;
    const stats: ServiceStats & { analytics: ServiceAnalytics } = { total, active, featured, categories: catGroups.length, averagePrice: avgPriceVal, totalRevenue: totalRevenueVal, analytics };
    await this.cache.set(cacheKey, stats, 600);
    return stats;
  }

  async exportServices(tenantId: string | null, options: { format: string; includeInactive?: boolean }): Promise<string> {
    const services = await prisma.service.findMany({ where: { ...(tenantId ? { tenantId } : {}), ...(options.includeInactive ? {} : { active: true }) }, orderBy: { name: 'asc' } });
    if (options.format === 'json') return JSON.stringify(services, null, 2);
    const headers = ['ID','Name','Slug','Description','Short Description','Price','Duration','Category','Featured','Active','Created At','Updated At'];
    const rows = services.map(s => [s.id, `"${String(s.name).replace(/"/g,'""')}"`, s.slug, `"${String(s.description).replace(/"/g,'""')}"`, s.shortDesc ? `"${String(s.shortDesc).replace(/"/g,'""')}"` : '', s.price ?? '', s.duration ?? '', s.category ?? '', s.featured ? 'Yes' : 'No', s.active ? 'Yes' : 'No', s.createdAt.toISOString(), s.updatedAt.toISOString()]);
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
      active: s.active,
      image: s.image,
      createdAt: s.createdAt?.toISOString?.() || String(s.createdAt),
      updatedAt: s.updatedAt?.toISOString?.() || String(s.updatedAt),
      tenantId: s.tenantId,
    };
  }

  private async clearCaches(tenantId: string | null, serviceId?: string) {
    const patterns = [`service-stats:${tenantId}:*`, `services-list:${tenantId}:*`];
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
