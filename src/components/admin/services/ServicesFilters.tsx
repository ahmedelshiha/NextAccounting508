import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
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

export function ServicesFilters({ filters, onFiltersChange, categories, className = '' }: ServicesFiltersProps) {
  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'all').length;

  const updateFilter = (key: keyof ServiceFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value } as any);
  };

  const clearAllFilters = () => {
    onFiltersChange({ search: '', category: 'all', featured: 'all', status: 'all' });
  };

  const hasActive = activeFilterCount > 0;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {hasActive && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">{activeFilterCount}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Filter Services</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-gray-500">STATUS</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={filters.status === 'all'} onCheckedChange={() => updateFilter('status', 'all')}>All Services</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={filters.status === 'active'} onCheckedChange={() => updateFilter('status', 'active')}>Active Only</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={filters.status === 'inactive'} onCheckedChange={() => updateFilter('status', 'inactive')}>Inactive Only</DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-gray-500">FEATURED</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={filters.featured === 'all'} onCheckedChange={() => updateFilter('featured', 'all')}>All Services</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={filters.featured === 'featured'} onCheckedChange={() => updateFilter('featured', 'featured')}>Featured Only</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={filters.featured === 'non-featured'} onCheckedChange={() => updateFilter('featured', 'non-featured')}>Non-Featured</DropdownMenuCheckboxItem>

          {categories.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-gray-500">CATEGORY</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={filters.category === 'all'} onCheckedChange={() => updateFilter('category', 'all')}>All Categories</DropdownMenuCheckboxItem>
              {categories.map(c => (
                <DropdownMenuCheckboxItem key={c} checked={filters.category === c} onCheckedChange={() => updateFilter('category', c)}>{c}</DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-gray-500 hover:text-gray-700">
          Clear
          <X className="w-3 h-3" />
        </Button>
      )}

      <div className="flex items-center space-x-1">
        {filters.status !== 'all' && (
          <Badge variant="outline" className="gap-1 cursor-pointer" onClick={() => updateFilter('status', 'all')}>
            Status: {filters.status}
            <X className="w-3 h-3" />
          </Badge>
        )}
        {filters.featured !== 'all' && (
          <Badge variant="outline" className="gap-1 cursor-pointer" onClick={() => updateFilter('featured', 'all')}>
            Featured: {filters.featured === 'featured' ? 'Yes' : 'No'}
            <X className="w-3 h-3" />
          </Badge>
        )}
        {filters.category !== 'all' && (
          <Badge variant="outline" className="gap-1 cursor-pointer" onClick={() => updateFilter('category', 'all')}>
            Category: {filters.category}
            <X className="w-3 h-3" />
          </Badge>
        )}
      </div>
    </div>
  );
}
