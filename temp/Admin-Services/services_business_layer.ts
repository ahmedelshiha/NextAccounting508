// src/services/services.service.ts
import { PrismaClient, Service, Prisma } from '@prisma/client';
import { Service as ServiceType, ServiceFormData, ServiceFilters, ServiceStats, ServiceAnalytics, BulkAction } from '@/types/services';
import { validateSlugUniqueness, generateSlug, sanitizeServiceData } from '@/lib/services/utils';
import { CacheService } from '@/lib/cache.service';
import { NotificationService } from '@/lib/notification.service';

export class ServicesService {
  constructor(
    private prisma: PrismaClient,
    private cache: CacheService = new CacheService(),
    private notifications: NotificationService = new NotificationService()
  ) {}

  /**
   * Retrieve services list with advanced filtering, sorting, and pagination
   * Supports multi-tenancy and comprehensive search capabilities
   */
  async getServicesList(
    tenantId: string | null,
    filters: ServiceFilters & { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{
    services: ServiceType[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      category,
      featured,
      status,
      limit = 20,
      offset = 0,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = filters;

    // Build dynamic where clause
    const where: Prisma.ServiceWhereInput = {
      ...(tenantId && { tenantId }),
    };

    // Apply filters
    if (status === 'active') {
      where.active = true;
    } else if (status === 'inactive') {
      where.active = false;
    }

    if (featured === 'featured') {
      where.featured = true;
    } else if (featured === 'non-featured') {
      where.featured = false;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by clause
    const orderBy: Prisma.ServiceOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.updatedAt = sortOrder;
    }

    try {
      // Execute queries in parallel for better performance
      const [services, total] = await Promise.all([
        this.prisma.service.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            _count: {
              select: {
                bookings: true, // Assuming there's a relation to bookings
              },
            },
          },
        }),
        this.prisma.service.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const page = Math.floor(offset / limit) + 1;

      return {
        services: services.map(this.transformServiceToType),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching services list:', error);
      throw new Error('Failed to retrieve services');
    }
  }

  /**
   * Retrieve a single service by ID with tenant isolation
   */
  async getServiceById(tenantId: string | null, serviceId: string): Promise<ServiceType | null> {
    try {
      const cacheKey = `service:${serviceId}:${tenantId}`;
      const cached = await this.cache.get<ServiceType>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const service = await this.prisma.service.findFirst({
        where: {
          id: serviceId,
          ...(tenantId && { tenantId }),
        },
        include: {
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      });

      if (!service) {
        return null;
      }

      const transformed = this.transformServiceToType(service);
      
      // Cache for 5 minutes
      await this.cache.set(cacheKey, transformed, 300);
      
      return transformed;
    } catch (error) {
      console.error('Error fetching service by ID:', error);
      throw new Error('Failed to retrieve service');
    }
  }

  /**
   * Create a new service with comprehensive validation and business logic
   */
  async createService(
    tenantId: string | null,
    data: ServiceFormData,
    createdBy: string
  ): Promise<ServiceType> {
    try {
      // Sanitize and validate input data
      const sanitizedData = sanitizeServiceData(data);
      
      // Generate unique slug if not provided or validate existing slug
      if (!sanitizedData.slug) {
        sanitizedData.slug = generateSlug(sanitizedData.name);
      }

      // Validate slug uniqueness within tenant
      await validateSlugUniqueness(this.prisma, sanitizedData.slug, tenantId);

      // Create service with audit trail
      const service = await this.prisma.service.create({
        data: {
          ...sanitizedData,
          ...(tenantId && { tenantId }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      });

      // Clear related caches
      await this.clearServiceCaches(tenantId);

      // Send notifications to relevant team members
      await this.notifications.notifyServiceCreated(service, createdBy);

      return this.transformServiceToType(service);
    } catch (error) {
      console.error('Error creating service:', error);
      if (error instanceof Error && error.message.includes('slug already exists')) {
        throw error;
      }
      throw new Error('Failed to create service');
    }
  }

  /**
   * Update an existing service with change tracking and validation
   */
  async updateService(
    tenantId: string | null,
    serviceId: string,
    data: Partial<ServiceFormData>,
    updatedBy: string
  ): Promise<ServiceType> {
    try {
      // Verify service exists and belongs to tenant
      const existingService = await this.getServiceById(tenantId, serviceId);
      if (!existingService) {
        throw new Error('Service not found');
      }

      // Sanitize update data
      const sanitizedData = sanitizeServiceData(data);

      // If slug is being updated, validate uniqueness
      if (sanitizedData.slug && sanitizedData.slug !== existingService.slug) {
        await validateSlugUniqueness(this.prisma, sanitizedData.slug, tenantId, serviceId);
      }

      // Update service
      const updatedService = await this.prisma.service.update({
        where: { id: serviceId },
        data: {
          ...sanitizedData,
          updatedAt: new Date(),
        },
        include: {
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      });

      // Clear caches
      await this.clearServiceCaches(tenantId, serviceId);

      // Track significant changes and send notifications
      const significantChanges = this.detectSignificantChanges(existingService, sanitizedData);
      if (significantChanges.length > 0) {
        await this.notifications.notifyServiceUpdated(updatedService, significantChanges, updatedBy);
      }

      return this.transformServiceToType(updatedService);
    } catch (error) {
      console.error('Error updating service:', error);
      throw new Error('Failed to update service');
    }
  }

  /**
   * Soft delete a service (set active: false)
   */
  async deleteService(tenantId: string | null, serviceId: string, deletedBy: string): Promise<void> {
    try {
      const existingService = await this.getServiceById(tenantId, serviceId);
      if (!existingService) {
        throw new Error('Service not found');
      }

      // Check if service has active bookings
      const activeBookingsCount = await this.prisma.booking.count({
        where: {
          serviceId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (activeBookingsCount > 0) {
        throw new Error('Cannot delete service with active bookings. Please cancel or complete existing bookings first.');
      }

      // Soft delete the service
      await this.prisma.service.update({
        where: { id: serviceId },
        data: {
          active: false,
          updatedAt: new Date(),
        },
      });

      // Clear caches
      await this.clearServiceCaches(tenantId, serviceId);

      // Notify relevant stakeholders
      await this.notifications.notifyServiceDeleted(existingService, deletedBy);
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  /**
   * Perform bulk actions on multiple services
   */
  async performBulkAction(
    tenantId: string | null,
    action: BulkAction,
    performedBy: string
  ): Promise<{ updatedCount: number; errors: string[] }> {
    const { action: actionType, serviceIds, value } = action;
    const errors: string[] = [];
    let updatedCount = 0;

    try {
      // Verify all services exist and belong to tenant
      const services = await this.prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          ...(tenantId && { tenantId }),
        },
      });

      if (services.length !== serviceIds.length) {
        const foundIds = services.map(s => s.id);
        const missingIds = serviceIds.filter(id => !foundIds.includes(id));
        errors.push(`Services not found: ${missingIds.join(', ')}`);
      }

      let updateData: Partial<Service> = {};

      switch (actionType) {
        case 'activate':
          updateData = { active: true };
          break;
        case 'deactivate':
          updateData = { active: false };
          break;
        case 'feature':
          updateData = { featured: true };
          break;
        case 'unfeature':
          updateData = { featured: false };
          break;
        case 'category':
          if (typeof value !== 'string') {
            throw new Error('Category value must be a string');
          }
          updateData = { category: value };
          break;
        case 'price-update':
          if (typeof value !== 'number') {
            throw new Error('Price value must be a number');
          }
          updateData = { price: value };
          break;
        case 'delete':
          // Check for active bookings for each service
          const servicesWithBookings = await Promise.all(
            services.map(async (service) => {
              const count = await this.prisma.booking.count({
                where: {
                  serviceId: service.id,
                  status: { in: ['PENDING', 'CONFIRMED'] },
                },
              });
              return { service, hasActiveBookings: count > 0 };
            })
          );

          const blockedServices = servicesWithBookings.filter(s => s.hasActiveBookings);
          if (blockedServices.length > 0) {
            errors.push(
              `Cannot delete services with active bookings: ${blockedServices
                .map(s => s.service.name)
                .join(', ')}`
            );
            
            // Only delete services without active bookings
            const deletableServices = servicesWithBookings
              .filter(s => !s.hasActiveBookings)
              .map(s => s.service.id);
            
            if (deletableServices.length > 0) {
              updateData = { active: false };
              const result = await this.prisma.service.updateMany({
                where: {
                  id: { in: deletableServices },
                  ...(tenantId && { tenantId }),
                },
                data: { ...updateData, updatedAt: new Date() },
              });
              updatedCount = result.count;
            }
          } else {
            updateData = { active: false };
          }
          break;
        default:
          throw new Error(`Unknown action: ${actionType}`);
      }

      // Perform bulk update if not delete or if delete with no active bookings
      if (actionType !== 'delete' || errors.length === 0) {
        const result = await this.prisma.service.updateMany({
          where: {
            id: { in: services.map(s => s.id) },
            ...(tenantId && { tenantId }),
          },
          data: { ...updateData, updatedAt: new Date() },
        });
        updatedCount = result.count;
      }

      // Clear caches for affected services
      await this.clearServiceCaches(tenantId);

      // Send bulk action notification
      if (updatedCount > 0) {
        await this.notifications.notifyBulkAction(actionType, updatedCount, performedBy);
      }

      return { updatedCount, errors };
    } catch (error) {
      console.error('Error performing bulk action:', error);
      throw new Error(`Failed to perform bulk action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive service statistics and analytics
   */
  async getServiceStats(tenantId: string | null, timeRange: string = '30d'): Promise<ServiceStats & { analytics: ServiceAnalytics }> {
    try {
      const cacheKey = `service-stats:${tenantId}:${timeRange}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      // Calculate date range
      const now = new Date();
      const daysAgo = this.parseDateRange(timeRange);
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Basic stats query
      const [totalServices, activeServices, featuredServices, categoriesResult, priceStats] = await Promise.all([
        this.prisma.service.count({
          where: { ...(tenantId && { tenantId }) },
        }),
        this.prisma.service.count({
          where: {
            active: true,
            ...(tenantId && { tenantId }),
          },
        }),
        this.prisma.service.count({
          where: {
            featured: true,
            active: true,
            ...(tenantId && { tenantId }),
          },
        }),
        this.prisma.service.groupBy({
          by: ['category'],
          where: {
            active: true,
            category: { not: null },
            ...(tenantId && { tenantId }),
          },
        }),
        this.prisma.service.aggregate({
          where: {
            active: true,
            price: { not: null },
            ...(tenantId && { tenantId }),
          },
          _avg: { price: true },
          _sum: { price: true },
        }),
      ]);

      // Analytics queries
      const [monthlyBookings, revenueByService, popularServices] = await Promise.all([
        this.getMonthlyBookingsTrend(tenantId, startDate),
        this.getRevenueByService(tenantId, startDate),
        this.getPopularServices(tenantId, startDate),
      ]);

      const stats = {
        total: totalServices,
        active: activeServices,
        featured: featuredServices,
        categories: categoriesResult.length,
        averagePrice: priceStats._avg.price || 0,
        totalRevenue: priceStats._sum.price || 0,
        analytics: {
          monthlyBookings,
          revenueByService,
          popularServices,
          conversionRates: await this.getConversionRates(tenantId, startDate),
        },
      };

      // Cache for 10 minutes
      await this.cache.set(cacheKey, stats, 600);
      return stats;
    } catch (error) {
      console.error('Error fetching service stats:', error);
      throw new Error('Failed to retrieve service statistics');
    }
  }

  /**
   * Export services data in various formats
   */
  async exportServices(
    tenantId: string | null,
    options: { format: string; includeInactive?: boolean }
  ): Promise<string> {
    try {
      const services = await this.prisma.service.findMany({
        where: {
          ...(tenantId && { tenantId }),
          ...(options.includeInactive ? {} : { active: true }),
        },
        orderBy: { name: 'asc' },
      });

      if (options.format === 'csv') {
        return this.formatServicesAsCSV(services);
      } else if (options.format === 'json') {
        return JSON.stringify(services, null, 2);
      } else {
        throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      console.error('Error exporting services:', error);
      throw new Error('Failed to export services');
    }
  }

  /**
   * Private helper methods
   */

  private transformServiceToType(service: any): ServiceType {
    return {
      id: service.id,
      slug: service.slug,
      name: service.name,
      description: service.description,
      shortDesc: service.shortDesc,
      features: service.features || [],
      price: service.price,
      duration: service.duration,
      category: service.category,
      featured: service.featured,
      active: service.active,
      image: service.image,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
      tenantId: service.tenantId,
    };
  }

  private async clearServiceCaches(tenantId: string | null, serviceId?: string): Promise<void> {
    const patterns = [
      `service-stats:${tenantId}:*`,
      `services-list:${tenantId}:*`,
    ];
    
    if (serviceId) {
      patterns.push(`service:${serviceId}:${tenantId}`);
    }

    await Promise.all(patterns.map(pattern => this.cache.deletePattern(pattern)));
  }

  private detectSignificantChanges(original: ServiceType, updates: Partial<ServiceFormData>): string[] {
    const changes: string[] = [];
    
    if (updates.name && updates.name !== original.name) {
      changes.push('name');
    }
    if (updates.price !== undefined && updates.price !== original.price) {
      changes.push('price');
    }
    if (updates.active !== undefined && updates.active !== original.active) {
      changes.push('status');
    }
    if (updates.featured !== undefined && updates.featured !== original.featured) {
      changes.push('featured');
    }

    return changes;
  }

  private parseDateRange(range: string): number {
    const match = range.match(/^(\d+)([dwmy])$/);
    if (!match) return 30; // Default to 30 days

    const [, num, unit] = match;
    const value = parseInt(num, 10);

    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 30;
    }
  }

  private async getMonthlyBookingsTrend(tenantId: string | null, startDate: Date) {
    // This would require a bookings table relationship
    // Implementation depends on your booking schema
    return [];
  }

  private async getRevenueByService(tenantId: string | null, startDate: Date) {
    // Implementation for revenue analytics
    return [];
  }

  private async getPopularServices(tenantId: string | null, startDate: Date) {
    // Implementation for popularity analytics
    return [];
  }

  private async getConversionRates(tenantId: string | null, startDate: Date) {
    // Implementation for conversion rate analytics
    return [];
  }

  private formatServicesAsCSV(services: any[]): string {
    const headers = [
      'ID', 'Name', 'Slug', 'Description', 'Short Description',
      'Price', 'Duration', 'Category', 'Featured', 'Active',
      'Created At', 'Updated At'
    ];

    const rows = services.map(service => [
      service.id,
      `"${service.name.replace(/"/g, '""')}"`,
      service.slug,
      `"${service.description.replace(/"/g, '""')}"`,
      service.shortDesc ? `"${service.shortDesc.replace(/"/g, '""')}"` : '',
      service.price || '',
      service.duration || '',
      service.category || '',
      service.featured ? 'Yes' : 'No',
      service.active ? 'Yes' : 'No',
      service.createdAt.toISOString(),
      service.updatedAt.toISOString(),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }