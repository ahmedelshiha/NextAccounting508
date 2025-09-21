// src/app/admin/services/page.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  LayoutGrid, 
  List, 
  FileText,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

// Enhanced Components
import { ServicesHeader } from '@/components/admin/services/ServicesHeader';
import { ServicesFilters } from '@/components/admin/services/ServicesFilters';
import { ServiceCard } from '@/components/admin/services/ServiceCard';
import { ServiceForm } from '@/components/admin/services/ServiceForm';
import { BulkActionsPanel } from '@/components/admin/services/BulkActionsPanel';

// Hooks and Types
import { useServicesData } from '@/hooks/useServicesData';
import { useServicesPermissions } from '@/hooks/useServicesPermissions';
import { Service, ServiceFormData, BulkAction } from '@/types/services';
import { apiFetch } from '@/lib/api';
import { filterServices, sortServices, extractCategories } from '@/lib/services/utils';

type ViewMode = 'grid' | 'table' | 'cards';
type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function EnhancedServicesPage() {
  // Permissions and data
  const permissions = useServicesPermissions();
  const {
    services,
    stats,
    loading,
    error,
    filters,
    setFilters,
    refresh,
  } = useServicesData({
    autoRefresh: 30000, // Refresh every 30 seconds
  });

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Computed values
  const categories = useMemo(() => extractCategories(services), [services]);
  
  const filteredAndSortedServices = useMemo(() => {
    const filtered = filterServices(services, filters);
    return sortServices(filtered, 'updatedAt', 'desc');
  }, [services, filters]);

  // Service Actions
  const handleCreateService = useCallback(async (data: ServiceFormData) => {
    try {
      setActionLoading(true);
      const response = await apiFetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create service');
      }

      const result = await response.json();
      toast.success(`Service "${data.name}" created successfully`);
      setModalMode(null);
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create service';
      toast.error(message);
      console.error('Create service error:', error);
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  const handleUpdateService = useCallback(async (data: ServiceFormData) => {
    if (!selectedService) return;

    try {
      setActionLoading(true);
      const response = await apiFetch(`/api/admin/services/${selectedService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update service');
      }

      toast.success(`Service "${data.name}" updated successfully`);
      setModalMode(null);
      setSelectedService(null);
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update service';
      toast.error(message);
      console.error('Update service error:', error);
    } finally {
      setActionLoading(false);
    }
  }, [selectedService, refresh]);

  const handleDeleteService = useCallback(async (service: Service) => {
    if (!window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiFetch(`/api/admin/services/${service.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete service');
      }

      toast.success(`Service "${service.name}" deleted successfully`);
      
      // Remove from selection if it was selected
      if (selectedIds.has(service.id)) {
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(service.id);
          return newSet;
        });
      }
      
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete service';
      toast.error(message);
      console.error('Delete service error:', error);
    } finally {
      setActionLoading(false);
    }
  }, [selectedIds, refresh]);

  const handleDuplicateService = useCallback(async (service: Service) => {
    const duplicateData: ServiceFormData = {
      name: `${service.name} (Copy)`,
      slug: `${service.slug}-copy-${Date.now()}`,
      description: service.description,
      shortDesc: service.shortDesc || '',
      features: [...(service.features || [])],
      price: service.price,
      duration: service.duration,
      category: service.category || '',
      featured: false, // Don't duplicate featured status
      active: service.active,
      image: service.image || '',
    };

    await handleCreateService(duplicateData);
  }, [handleCreateService]);

  const handleToggleActive = useCallback(async (service: Service) => {
    try {
      setActionLoading(true);
      const response = await apiFetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle service status');
      }

      toast.success(`Service ${service.active ? 'deactivated' : 'activated'}`);
      refresh();
    } catch (error) {
      toast.error('Failed to update service status');
      console.error('Toggle active error:', error);
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  const handleToggleFeatured = useCallback(async (service: Service) => {
    try {
      setActionLoading(true);
      const response = await apiFetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !service.featured }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle featured status');
      }

      toast.success(`Service ${service.featured ? 'removed from' : 'added to'} featured`);
      refresh();
    } catch (error) {
      toast.error('Failed to update featured status');
      console.error('Toggle featured error:', error);
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  // Bulk Actions
  const handleBulkAction = useCallback(async (action: BulkAction) => {
    try {
      setActionLoading(true);
      const response = await apiFetch('/api/admin/services/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk action failed');
      }

      const result = await response.json();
      toast.success(result.message);
      
      // Clear selection after successful bulk action
      setSelectedIds(new Set());
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bulk action failed';
      toast.error(message);
      console.error('Bulk action error:', error);
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  // Selection Handlers
  const handleSelectService = useCallback((serviceId: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(serviceId);
      } else {
        newSet.delete(serviceId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(filteredAndSortedServices.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredAndSortedServices]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Export Handler
  const handleExport = useCallback(async () => {
    try {
      const response = await apiFetch('/api/admin/services/export?format=csv');
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `services-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Services exported successfully');
    } catch (error) {
      toast.error('Failed to export services');
      console.error('Export error:', error);
    }
  }, []);

  // Modal Handlers
  const openCreateModal = () => {
    setSelectedService(null);
    setModalMode('create');
  };

  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedService(null);
  };

  // Permission Guard
  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to view services management.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <ServicesHeader
        stats={stats}
        searchTerm={filters.search}
        onSearchChange={(value) => setFilters({ ...filters, search: value })}
        onRefresh={refresh}
        onExport={handleExport}
        onCreateNew={openCreateModal}
        loading={loading}
      />

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-900">Error Loading Services</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={refresh}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and View Controls */}
        <div className="flex items-center justify-between mb-6">
          <ServicesFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
          />

          <div className="flex items-center gap-2">
            {/* Select All */}
            {viewMode === 'grid' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(selectedIds.size !== filteredAndSortedServices.length)}
                className="gap-2"
              >
                {selectedIds.size === filteredAndSortedServices.length ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                )}
                {selectedIds.size === filteredAndSortedServices.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {selectedIds.size > 0 && (
          <div className="mb-6">
            <BulkActionsPanel
              selectedIds={Array.from(selectedIds)}
              onClearSelection={handleClearSelection}
              onBulkAction={handleBulkAction}
              categories={categories}
              loading={actionLoading}
            />
          </div>
        )}

        {/* Services Grid */}
        <div className="space-y-6">
          {loading && services.length === 0 ? (
            // Loading State
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                    <div className="h-16 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedServices.length === 0 ? (
            // Empty State
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {services.length === 0 ? 'No Services Yet' : 'No Services Found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {services.length === 0
                  ? 'Get started by creating your first service offering.'
                  : 'Try adjusting your search criteria or filters.'
                }
              </p>
              {services.length === 0 && permissions.canCreate && (
                <Button onClick={openCreateModal} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Create Your First Service
                </Button>
              )}
            </Card>
          ) : (
            // Services Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedIds.has(service.id)}
                  onSelect={(selected) => handleSelectService(service.id, selected)}
                  onEdit={openEditModal}
                  onDuplicate={handleDuplicateService}
                  onDelete={handleDeleteService}
                  onToggleActive={handleToggleActive}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredAndSortedServices.length > 0 && (
          <div className="mt-8 flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredAndSortedServices.length} of {services.length} services
              {selectedIds.size > 0 && (
                <Badge variant="outline" className="ml-2">
                  {selectedIds.size} selected
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              {stats && (
                <span>${stats.totalRevenue.toLocaleString()} estimated revenue</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalMode === 'create' || modalMode === 'edit'} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {modalMode === 'create' ? 'Create New Service' : 'Edit Service'}
            </DialogTitle>
          </DialogHeader>
          
          <ServiceForm
            initialData={selectedService}
            onSubmit={modalMode === 'create' ? handleCreateService : handleUpdateService}
            onCancel={closeModal}
            loading={actionLoading}
            categories={categories}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// src/components/admin/services/ServicesAnalytics.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  Calendar,
  Target
} from 'lucide-react';
import { ServiceAnalytics } from '@/types/services';

interface ServicesAnalyticsProps {
  analytics: ServiceAnalytics | null;
  loading?: boolean;
  className?: string;
}

export function ServicesAnalytics({ analytics, loading, className = '' }: ServicesAnalyticsProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Unavailable</h3>
          <p className="text-gray-600">Service analytics data is not available at this time.</p>
        </CardContent>
      </Card>
    );
  }

  const totalBookings = analytics.monthlyBookings.reduce((sum, item) => sum + item.bookings, 0);
  const totalRevenue = analytics.revenueByService.reduce((sum, item) => sum + item.revenue, 0);
  const avgConversionRate = analytics.conversionRates.length > 0
    ? analytics.conversionRates.reduce((sum, item) => sum + item.rate, 0) / analytics.conversionRates.length
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalBookings.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-green-600">+12%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-green-600">+8%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{(avgConversionRate * 100).toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <TrendingDown className="w-3 h-3 text-red-600" />
              <span className="text-red-600">-2%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Booking Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(0) : '0'}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-green-600">+5%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Most Popular Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.popularServices.slice(0, 5).map((service, index) => (
                <div key={service.service} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium">{service.service}</span>
                  </div>
                  <Badge variant="outline">
                    {service.bookings} bookings
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Revenue by Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.revenueByService.slice(0, 5).map((service, index) => (
                <div key={service.service} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium">{service.service}</span>
                  </div>
                  <Badge variant="outline">
                    ${service.revenue.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bookings Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Booking Trends (Last 12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.monthlyBookings.map((month, index) => {
              const maxBookings = Math.max(...analytics.monthlyBookings.map(m => m.bookings));
              const height = maxBookings > 0 ? (month.bookings / maxBookings) * 100 : 0;
              
              return (
                <div key={month.month} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="bg-blue-500 rounded-t-sm w-full transition-all duration-300 hover:bg-blue-600 relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {month.bookings}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 transform -rotate-45 whitespace-nowrap">
                    {month.month}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}