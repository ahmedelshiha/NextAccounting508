import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { ServiceFormData } from '@/types/services';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\W_]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function validateSlugUniqueness(
  slug: string,
  tenantId: string | null,
  excludeServiceId?: string
): Promise<void> {
  const where: Prisma.ServiceWhereInput = { slug };
  if (tenantId) (where as any).tenantId = tenantId;
  if (excludeServiceId) (where as any).id = { not: excludeServiceId } as any;
  const exists = await prisma.service.findFirst({ where });
  if (exists) throw new Error('A service with this slug already exists');
}

export function sanitizeServiceData(data: Partial<ServiceFormData>): Partial<ServiceFormData> {
  const out: Partial<ServiceFormData> = {};

  if (data.name !== undefined) {
    out.name = String(data.name).trim();
    if (out.name.length > 100) throw new Error('Service name is too long (max 100)');
  }

  if (data.slug !== undefined) {
    const s = String(data.slug).trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(s)) throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    out.slug = s;
  }

  if (data.description !== undefined) {
    out.description = String(data.description).trim();
    if (out.description.length > 2000) throw new Error('Description too long (max 2000)');
  }

  if (data.shortDesc !== undefined) {
    const v = String(data.shortDesc || '').trim();
    if (v && v.length > 200) throw new Error('Short description too long (max 200)');
    out.shortDesc = v || undefined;
  }

  if (data.category !== undefined) {
    const v = String(data.category || '').trim();
    if (v && v.length > 50) throw new Error('Category name too long (max 50)');
    out.category = v || undefined;
  }

  if (data.price !== undefined) {
    if (data.price === null) out.price = null; else {
      const n = Number(data.price);
      if (!isFinite(n) || n < 0 || n > 999999) throw new Error('Invalid price');
      out.price = n;
    }
  }

  if (data.duration !== undefined) {
    if (data.duration === null) out.duration = null; else {
      const n = Math.floor(Number(data.duration));
      if (!isFinite(n) || n < 1 || n > 1440) throw new Error('Invalid duration');
      out.duration = n;
    }
  }

  if (data.features !== undefined) {
    const arr = Array.isArray(data.features) ? data.features : [];
    out.features = arr.map(f => String(f).trim()).filter(Boolean).slice(0, 20);
  }

  if (data.featured !== undefined) out.featured = !!data.featured;
  if (data.active !== undefined) out.active = !!data.active;

  if (data.image !== undefined) {
    const v = data.image ? String(data.image) : '';
    if (v) {
      try { new URL(v); } catch { throw new Error('Invalid image URL'); }
      out.image = v;
    } else out.image = undefined;
  }

  return out;
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return 'Not specified';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  return h ? `${d}d ${h}h` : `${d}d`;
}

export function formatPrice(price: number | null, currency = 'USD'): string {
  if (price == null) return 'Contact for pricing';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: price % 1 === 0 ? 0 : 2 }).format(price);
}

export function extractCategories(services: any[]): string[] {
  const set = new Set<string>();
  services.forEach(s => { if (s.category && String(s.category).trim()) set.add(String(s.category).trim()); });
  return Array.from(set).sort();
}

export function sortServices<T extends any[]>(services: T, sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): T {
  const sorted = [...services].sort((a: any, b: any) => {
    const by = sortBy;
    let av: any; let bv: any;
    if (by === 'name') { av = a.name?.toLowerCase() || ''; bv = b.name?.toLowerCase() || ''; }
    else if (by === 'price') { av = a.price || 0; bv = b.price || 0; }
    else if (by === 'createdAt' || by === 'updatedAt') { av = new Date(a[by]).getTime(); bv = new Date(b[by]).getTime(); }
    else if (by === 'bookings') { av = a._count?.bookings || 0; bv = b._count?.bookings || 0; }
    else return 0;
    if (av < bv) return sortOrder === 'asc' ? -1 : 1;
    if (av > bv) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted as T;
}

export function filterServices(services: any[], filters: any) {
  return services.filter(s => {
    if (filters.search) {
      const q = String(filters.search).toLowerCase();
      const txt = [s.name, s.slug, s.shortDesc, s.description, s.category].filter(Boolean).join(' ').toLowerCase();
      if (!txt.includes(q)) return false;
    }
    if (filters.status === 'active' && !s.active) return false;
    if (filters.status === 'inactive' && s.active) return false;
    if (filters.featured === 'featured' && !s.featured) return false;
    if (filters.featured === 'non-featured' && s.featured) return false;
    if (filters.category && filters.category !== 'all' && s.category !== filters.category) return false;
    if (filters.minPrice != null || filters.maxPrice != null) {
      const p = s.price || 0;
      if (filters.minPrice != null && p < filters.minPrice) return false;
      if (filters.maxPrice != null && p > filters.maxPrice) return false;
    }
    return true;
  });
}

export function validateBulkAction(action: string, ids: string[], value?: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!ids || ids.length === 0) errors.push('At least one service must be selected');
  if (action === 'category' && !(typeof value === 'string' && value.trim())) errors.push('Category name is required');
  if (action === 'price-update') {
    const v = Number(value);
    if (!isFinite(v) || v < 0) errors.push('Valid price is required');
  }
  return { isValid: errors.length === 0, errors };
}
