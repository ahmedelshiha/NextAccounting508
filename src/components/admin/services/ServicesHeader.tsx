import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Download, Search, Filter, BarChart3, Settings } from 'lucide-react';
import { ServiceStats } from '@/types/services';
import { useServicesPermissions } from '@/hooks/useServicesPermissions';

interface ServicesHeaderProps {
  stats: ServiceStats | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onCreateNew: () => void;
  loading: boolean;
}

export function ServicesHeader({ stats, searchTerm, onSearchChange, onRefresh, onExport, onCreateNew, loading }: ServicesHeaderProps) {
  const permissions = useServicesPermissions();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
            <p className="text-sm text-gray-600">Manage your service offerings, pricing, and availability</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {permissions.canViewAnalytics && (
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
          )}

          {permissions.canExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {permissions.canCreate && (
            <Button onClick={onCreateNew} className="gap-2">
              <Plus className="w-4 h-4" />
              New Service
            </Button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Services</div>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-700">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-700">{stats.featured}</div>
            <div className="text-sm text-gray-600">Featured</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-700">{stats.categories}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-700">${stats.averagePrice.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Avg. Price</div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-indigo-700">${(stats.totalRevenue || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">Est. Revenue</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input type="text" placeholder="Search services..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
