// src/lib/services/utils.ts
import { PrismaClient } from '@prisma/client';
import { ServiceFormData } from '@/types/services';

/**
 * Generate a URL-friendly slug from a service name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate that a slug is unique within the tenant scope
 */
export async function validateSlugUniqueness(
  prisma: PrismaClient,
  slug: string,
  tenantId: string | null,
  excludeServiceId?: string
): Promise<void> {
  const existingService = await prisma.service.findFirst({
    where: {
      slug,
      ...(tenantId && { tenantId }),
      ...(excludeServiceId && { id: { not: excludeServiceId } }),
    },
  });

  if (existingService) {
    throw new Error('A service with this slug already exists');
  }
}

/**
 * Sanitize and validate service form data
 */
export function sanitizeServiceData(data: Partial<ServiceFormData>): Partial<ServiceFormData> {
  const sanitized: Partial<ServiceFormData> = {};

  // Handle string fields with trimming and length validation
  if (data.name !== undefined) {
    sanitized.name = data.name.trim();
    if (sanitized.name.length > 100) {
      throw new Error('Service name is too long (max 100 characters)');
    }
  }

  if (data.slug !== undefined) {
    sanitized.slug = data.slug.toLowerCase().trim();
    if (!/^[a-z0-9-]+$/.test(sanitized.slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }
  }

  if (data.description !== undefined) {
    sanitized.description = data.description.trim();
    if (sanitized.description.length > 2000) {
      throw new Error('Description is too long (max 2000 characters)');
    }
  }

  if (data.shortDesc !== undefined) {
    sanitized.shortDesc = data.shortDesc.trim() || undefined;
    if (sanitized.shortDesc && sanitized.shortDesc.length > 200) {
      throw new Error('Short description is too long (max 200 characters)');
    }
  }

  if (data.category !== undefined) {
    sanitized.category = data.category.trim() || undefined;
    if (sanitized.category && sanitized.category.length > 50) {
      throw new Error('Category name is too long (max 50 characters)');
    }
  }

  // Handle numeric fields with validation
  if (data.price !== undefined) {
    if (data.price !== null) {
      const price = Number(data.price);
      if (isNaN(price) || price < 0 || price > 999999) {
        throw new Error('Price must be a valid number between 0 and 999,999');
      }
      sanitized.price = price;
    } else {
      sanitized.price = null;
    }
  }

  if (data.duration !== undefined) {
    if (data.duration !== null) {
      const duration = Number(data.duration);
      if (isNaN(duration) || duration < 1 || duration > 1440) {
        throw new Error('Duration must be between 1 and 1440 minutes');
      }
      sanitized.duration = Math.floor(duration);
    } else {
      sanitized.duration = null;
    }
  }

  // Handle array fields
  if (data.features !== undefined) {
    if (Array.isArray(data.features)) {
      sanitized.features = data.features
        .map(f => f.trim())
        .filter(f => f.length > 0)
        .slice(0, 20); // Limit to 20 features
    } else {
      sanitized.features = [];
    }
  }

  // Handle boolean fields
  if (data.featured !== undefined) {
    sanitized.featured = Boolean(data.featured);
  }

  if (data.active !== undefined) {
    sanitized.active = Boolean(data.active);
  }

  // Handle image URL
  if (data.image !== undefined) {
    if (data.image && typeof data.image === 'string') {
      try {
        new URL(data.image); // Validate URL format
        sanitized.image = data.image;
      } catch {
        throw new Error('Invalid image URL format');
      }
    } else {
      sanitized.image = undefined;
    }
  }

  return sanitized;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes) return 'Not specified';
  
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
}

/**
 * Format price with proper currency formatting
 */
export function formatPrice(price: number | null, currency: string = 'USD'): string {
  if (price === null || price === undefined) return 'Contact for pricing';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

/**
 * Generate service categories from existing services
 */
export function extractCategories(services: any[]): string[] {
  const categories = new Set<string>();
  services.forEach(service => {
    if (service.category && service.category.trim()) {
      categories.add(service.category.trim());
    }
  });
  return Array.from(categories).sort();
}

/**
 * Calculate service performance metrics
 */
export function calculateServiceMetrics(service: any) {
  const bookingsCount = service._count?.bookings || 0;
  const revenue = service.price && bookingsCount ? service.price * bookingsCount : 0;
  
  return {
    totalBookings: bookingsCount,
    estimatedRevenue: revenue,
    isPopular: bookingsCount > 10, // Configurable threshold
    needsAttention: bookingsCount === 0 && service.active,
  };
}

/**
 * Sort services by various criteria
 */
export function sortServices<T extends any[]>(
  services: T,
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): T {
  const sorted = [...services].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'price':
        aValue = a.price || 0;
        bValue = b.price || 0;
        break;
      case 'createdAt':
      case 'updatedAt':
        aValue = new Date(a[sortBy]).getTime();
        bValue = new Date(b[sortBy]).getTime();
        break;
      case 'bookings':
        aValue = a._count?.bookings || 0;
        bValue = b._count?.bookings || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted as T;
}

/**
 * Filter services based on complex criteria
 */
export function filterServices(services: any[], filters: any) {
  return services.filter(service => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableText = [
        service.name,
        service.slug,
        service.shortDesc,
        service.description,
        service.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    // Status filter
    if (filters.status === 'active' && !service.active) return false;
    if (filters.status === 'inactive' && service.active) return false;

    // Featured filter
    if (filters.featured === 'featured' && !service.featured) return false;
    if (filters.featured === 'non-featured' && service.featured) return false;

    // Category filter
    if (filters.category && filters.category !== 'all') {
      if (service.category !== filters.category) return false;
    }

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const price = service.price || 0;
      if (filters.minPrice !== undefined && price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
    }

    return true;
  });
}

/**
 * Validate bulk action requirements
 */
export function validateBulkAction(action: string, serviceIds: string[], value?: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!serviceIds || serviceIds.length === 0) {
    errors.push('At least one service must be selected');
  }

  switch (action) {
    case 'category':
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        errors.push('Category name is required for category update');
      }
      break;
    case 'price-update':
      if (value === undefined || value === null || isNaN(Number(value)) || Number(value) < 0) {
        errors.push('Valid price is required for price update');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate service analytics summary
 */
export function generateServiceSummary(services: any[]) {
  const activeServices = services.filter(s => s.active);
  const pricedServices = activeServices.filter(s => s.price);
  
  const totalRevenue = pricedServices.reduce((sum, s) => {
    const bookings = s._count?.bookings || 0;
    return sum + (s.price * bookings);
  }, 0);

  const averagePrice = pricedServices.length > 0
    ? pricedServices.reduce((sum, s) => sum + s.price, 0) / pricedServices.length
    : 0;

  const categories = extractCategories(activeServices);
  
  return {
    total: services.length,
    active: activeServices.length,
    featured: activeServices.filter(s => s.featured).length,
    withPricing: pricedServices.length,
    categories: categories.length,
    averagePrice,
    totalRevenue,
    topCategories: categories.slice(0, 5),
    needsAttention: activeServices.filter(s => (s._count?.bookings || 0) === 0).length,
  };
}

// src/hooks/useServicesPermissions.ts
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export interface ServicesPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canBulkEdit: boolean;
  canExport: boolean;
  canViewAnalytics: boolean;
  canManageFeatured: boolean;
}

export function useServicesPermissions(): ServicesPermissions {
  const { data: session } = useSession();

  return useMemo(() => {
    if (!session?.user) {
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canBulkEdit: false,
        canExport: false,
        canViewAnalytics: false,
        canManageFeatured: false,
      };
    }

    const role = session.user.role;
    const isAdmin = role === 'ADMIN';
    const isStaff = role === 'STAFF' || isAdmin;

    return {
      canView: isStaff,
      canCreate: isAdmin,
      canEdit: isAdmin,
      canDelete: isAdmin,
      canBulkEdit: isAdmin,
      canExport: isStaff,
      canViewAnalytics: isStaff,
      canManageFeatured: isAdmin,
    };
  }, [session?.user]);
}

// src/hooks/useServicesData.ts
import { useState, useEffect, useCallback } from 'react';
import { Service, ServiceFilters, ServiceStats } from '@/types/services';
import { apiFetch } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

interface UseServicesDataOptions {
  initialFilters?: Partial<ServiceFilters>;
  autoRefresh?: number; // Auto-refresh interval in milliseconds
}

export function useServicesData(options: UseServicesDataOptions = {}) {
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<ServiceFilters>({
    search: '',
    category: 'all',
    featured: 'all',
    status: 'all',
    ...options.initialFilters,
  });

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(filters.search, 300);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (debouncedSearch) searchParams.set('search', debouncedSearch);
      if (filters.category !== 'all') searchParams.set('category', filters.category);
      if (filters.featured !== 'all') searchParams.set('featured', filters.featured);
      if (filters.status !== 'all') searchParams.set('status', filters.status);

      const response = await apiFetch(`/api/admin/services?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to load services');
      }

      const data = await response.json();
      setServices(data.services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.category, filters.featured, filters.status]);

  const loadStats = useCallback(async () => {
    try {
      const response = await apiFetch('/api/admin/services/stats');
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Auto-refresh functionality
  useEffect(() => {
    if (options.autoRefresh && options.autoRefresh > 0) {
      const interval = setInterval(() => {
        loadServices();
        loadStats();
      }, options.autoRefresh);

      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, loadServices, loadStats]);

  const refresh = useCallback(() => {
    loadServices();
    loadStats();
  }, [loadServices, loadStats]);

  return {
    services,
    stats,
    loading,
    error,
    filters,
    setFilters,
    refresh,
  };
}

// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}