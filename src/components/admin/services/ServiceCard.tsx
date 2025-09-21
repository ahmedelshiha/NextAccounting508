import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Copy, Trash2, Eye, EyeOff, Star, StarOff, DollarSign, Clock, Tag } from 'lucide-react';
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

export function ServiceCard({ service, isSelected = false, onSelect, onEdit, onDuplicate, onDelete, onToggleActive, onToggleFeatured }: ServiceCardProps) {
  const permissions = useServicesPermissions();

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''} ${!service.active ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {onSelect && (
              <input type="checkbox" checked={isSelected} onChange={(e) => onSelect(e.target.checked)} className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{service.name}</h3>
              <p className="text-sm text-gray-500 font-mono">/{service.slug}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {service.featured && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            <Badge variant={service.active ? 'default' : 'secondary'}>{service.active ? 'Active' : 'Inactive'}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {service.shortDesc && <p className="text-sm text-gray-600 line-clamp-2">{service.shortDesc}</p>}
        <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{formatPrice(service.price ?? null)}</span>
          </div>
          {service.duration && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{formatDuration(service.duration)}</span>
            </div>
          )}
          {service.category && (
            <div className="flex items-center space-x-2 col-span-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{service.category}</span>
            </div>
          )}
        </div>
        {service.features && service.features.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <div className="flex flex-wrap gap-1">
              {service.features.slice(0, 3).map((f, i) => (
                <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
              ))}
              {service.features.length > 3 && (
                <Badge variant="outline" className="text-xs">+{service.features.length - 3} more</Badge>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            {permissions.canEdit && (
              <Button size="sm" variant="ghost" onClick={() => onEdit(service)} className="gap-1">
                <Edit3 className="w-3 h-3" />
                Edit
              </Button>
            )}
            {permissions.canCreate && (
              <Button size="sm" variant="ghost" onClick={() => onDuplicate(service)} className="gap-1">
                <Copy className="w-3 h-3" />
                Copy
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {permissions.canManageFeatured && (
              <Button size="sm" variant="ghost" onClick={() => onToggleFeatured(service)} className="gap-1" title={service.featured ? 'Remove from featured' : 'Add to featured'}>
                {service.featured ? <StarOff className="w-3 h-3" /> : <Star className="w-3 h-3" />}
              </Button>
            )}
            {permissions.canEdit && (
              <Button size="sm" variant="ghost" onClick={() => onToggleActive(service)} className="gap-1" title={service.active ? 'Deactivate' : 'Activate'}>
                {service.active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            )}
            {permissions.canDelete && (
              <Button size="sm" variant="ghost" onClick={() => onDelete(service)} className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
