// src/components/admin/services/ServicesHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  RefreshCw, 
  Download, 
  Search, 
  Filter,
  BarChart3,
  Settings
} from 'lucide-react';
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

export function ServicesHeader({
  stats,
  searchTerm,
  onSearchChange,
  onRefresh,
  onExport,
  onCreateNew,
  loading
}: ServicesHeaderProps) {
  const permissions = useServicesPermissions();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      {/* Header Title and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
            <p className="text-sm text-gray-600">
              Manage your service offerings, pricing, and availability
            </p>
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={loading}
            className="gap-2"
          >
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

      {/* Stats Overview */}
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
            <div className="text-2xl font-bold text-purple-700">
              ${stats.averagePrice.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Avg. Price</div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-indigo-700">
              ${(stats.totalRevenue || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Est. Revenue</div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
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

// src/components/admin/services/ServicesFilters.tsx
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { ServiceFilters } from '@/types/services';

interface ServicesFiltersProps {
  filters: ServiceFilters;
  onFiltersChange: (filters: ServiceFilters) => void;
  categories: string[];
  className?: string;
}

export function ServicesFilters({
  filters,
  onFiltersChange,
  categories,
  className = ''
}: ServicesFiltersProps) {
  const activeFilterCount = Object.values(filters).filter(
    value => value && value !== 'all'
  ).length;

  const updateFilter = (key: keyof ServiceFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      category: 'all',
      featured: 'all',
      status: 'all',
    });
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Filter Services</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Status Filter */}
          <DropdownMenuLabel className="text-xs text-gray-500">
            STATUS
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={filters.status === 'all'}
            onCheckedChange={() => updateFilter('status', 'all')}
          >
            All Services
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.status === 'active'}
            onCheckedChange={() => updateFilter('status', 'active')}
          >
            Active Only
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.status === 'inactive'}
            onCheckedChange={() => updateFilter('status', 'inactive')}
          >
            Inactive Only
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuSeparator />
          
          {/* Featured Filter */}
          <DropdownMenuLabel className="text-xs text-gray-500">
            FEATURED
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={filters.featured === 'all'}
            onCheckedChange={() => updateFilter('featured', 'all')}
          >
            All Services
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.featured === 'featured'}
            onCheckedChange={() => updateFilter('featured', 'featured')}
          >
            Featured Only
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.featured === 'non-featured'}
            onCheckedChange={() => updateFilter('featured', 'non-featured')}
          >
            Non-Featured
          </DropdownMenuCheckboxItem>
          
          {/* Category Filter */}
          {categories.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-gray-500">
                CATEGORY
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.category === 'all'}
                onCheckedChange={() => updateFilter('category', 'all')}
              >
                All Categories
              </DropdownMenuCheckboxItem>
              {categories.map(category => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filters.category === category}
                  onCheckedChange={() => updateFilter('category', category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="gap-1 text-gray-500 hover:text-gray-700"
        >
          Clear
          <X className="w-3 h-3" />
        </Button>
      )}

      {/* Active Filter Tags */}
      <div className="flex items-center space-x-1">
        {filters.status !== 'all' && (
          <Badge 
            variant="outline" 
            className="gap-1 cursor-pointer"
            onClick={() => updateFilter('status', 'all')}
          >
            Status: {filters.status}
            <X className="w-3 h-3" />
          </Badge>
        )}
        
        {filters.featured !== 'all' && (
          <Badge 
            variant="outline"
            className="gap-1 cursor-pointer"
            onClick={() => updateFilter('featured', 'all')}
          >
            Featured: {filters.featured === 'featured' ? 'Yes' : 'No'}
            <X className="w-3 h-3" />
          </Badge>
        )}
        
        {filters.category !== 'all' && (
          <Badge 
            variant="outline"
            className="gap-1 cursor-pointer"
            onClick={() => updateFilter('category', 'all')}
          >
            Category: {filters.category}
            <X className="w-3 h-3" />
          </Badge>
        )}
      </div>
    </div>
  );
}

// src/components/admin/services/ServiceCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff,
  DollarSign,
  Clock,
  Tag
} from 'lucide-react';
import { Service } from '@/types/services';
import { formatPrice, formatDuration } from '@/lib/services/utils';
import { useServicesPermissions } from '@/hooks/useServicesPermissions';

interface ServiceCardProps {
  service: Service;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onEdit: (service: Service) => void;
  onDuplicate: (service: Service) => void;
  onDelete: (service: Service) => void;
  onToggleActive: (service: Service) => void;
  onToggleFeatured: (service: Service) => void;
}

export function ServiceCard({
  service,
  isSelected = false,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
  onToggleFeatured,
}: ServiceCardProps) {
  const permissions = useServicesPermissions();

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''
    } ${!service.active ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {service.name}
              </h3>
              <p className="text-sm text-gray-500 font-mono">
                /{service.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {service.featured && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            
            <Badge variant={service.active ? 'default' : 'secondary'}>
              {service.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Service Description */}
        {service.shortDesc && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {service.shortDesc}
          </p>
        )}

        {/* Service Details */}
        <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">
              {formatPrice(service.price)}
            </span>
          </div>
          
          {service.duration && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {formatDuration(service.duration)}
              </span>
            </div>
          )}
          
          {service.category && (
            <div className="flex items-center space-x-2 col-span-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {service.category}
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        {service.features && service.features.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <div className="flex flex-wrap gap-1">
              {service.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {service.features.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{service.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            {permissions.canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(service)}
                className="gap-1"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </Button>
            )}
            
            {permissions.canCreate && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDuplicate(service)}
                className="gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {permissions.canManageFeatured && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleFeatured(service)}
                className="gap-1"
                title={service.featured ? 'Remove from featured' : 'Add to featured'}
              >
                {service.featured ? (
                  <StarOff className="w-3 h-3" />
                ) : (
                  <Star className="w-3 h-3" />
                )}
              </Button>
            )}

            {permissions.canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleActive(service)}
                className="gap-1"
                title={service.active ? 'Deactivate' : 'Activate'}
              >
                {service.active ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </Button>
            )}

            {permissions.canDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(service)}
                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}