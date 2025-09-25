'use client'

import { useState, useEffect, useCallback } from 'react';
import { Service, ServiceFilters, ServiceStats } from '@/types/services';
import { apiFetch } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

interface UseServicesDataOptions {
  initialFilters?: Partial<ServiceFilters>;
  autoRefresh?: number;
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

  const debouncedSearch = useDebounce(filters.search, 300);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const qp = new URLSearchParams();
      if (debouncedSearch) qp.set('search', debouncedSearch);
      if (filters.category !== 'all') qp.set('category', filters.category);
      if (filters.featured !== 'all') qp.set('featured', filters.featured);
      if (filters.status !== 'all') qp.set('status', filters.status);
      const res = await apiFetch(`/api/admin/services?${qp.toString()}`);
      if (!res.ok) throw new Error('Failed to load services');
      const data = await res.json();
      setServices(Array.isArray(data.services) ? data.services : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.category, filters.featured, filters.status]);

  const loadStats = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/services/stats');
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (options.autoRefresh && options.autoRefresh > 0) {
      const t = setInterval(() => { loadServices(); loadStats(); }, options.autoRefresh);
      return () => clearInterval(t);
    }
  }, [options.autoRefresh, loadServices, loadStats]);

  const refresh = useCallback(() => { loadServices(); loadStats(); }, [loadServices, loadStats]);

  return { services, stats, loading, error, filters, setFilters, refresh };
}
