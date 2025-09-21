// src/components/admin/services/ServiceForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ServiceFormData, Service } from '@/types/services';
import { ServiceSchema } from '@/schemas/services';
import { generateSlug } from '@/lib/services/utils';
import { Plus, X, DollarSign, Clock, Tag } from 'lucide-react';

interface ServiceFormProps {
  initialData?: Service | null;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  categories?: string[];
}

export function ServiceForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  categories = [],
}: ServiceFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      shortDesc: initialData?.shortDesc || '',
      features: initialData?.features || [],
      price: initialData?.price || undefined,
      duration: initialData?.duration || undefined,
      category: initialData?.category || '',
      featured: initialData?.featured || false,
      active: initialData?.active ?? true,
      image: initialData?.image || '',
    },
  });

  const watchedName = watch('name');
  const watchedFeatures = watch('features');

  // Auto-generate slug from name for new services
  React.useEffect(() => {
    if (!isEditing && watchedName) {
      setValue('slug', generateSlug(watchedName));
    }
  }, [watchedName, setValue, isEditing]);

  const addFeature = () => {
    const currentFeatures = watchedFeatures || [];
    setValue('features', [...currentFeatures, '']);
  };

  const updateFeature = (index: number, value: string) => {
    const currentFeatures = [...(watchedFeatures || [])];
    currentFeatures[index] = value;
    setValue('features', currentFeatures);
  };

  const removeFeature = (index: number) => {
    const currentFeatures = [...(watchedFeatures || [])];
    currentFeatures.splice(index, 1);
    setValue('features', currentFeatures);
  };

  const onFormSubmit = async (data: ServiceFormData) => {
    // Filter out empty features
    data.features = data.features.filter(feature => feature.trim() !== '');
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter service name"
                className={errors.name ? 'border-red-300' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="url-friendly-slug"
                className={errors.slug ? 'border-red-300' : ''}
              />
              {errors.slug && (
                <p className="text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDesc">Short Description</Label>
            <Input
              id="shortDesc"
              {...register('shortDesc')}
              placeholder="Brief description for listings"
              className={errors.shortDesc ? 'border-red-300' : ''}
            />
            {errors.shortDesc && (
              <p className="text-sm text-red-600">{errors.shortDesc.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Brief summary shown in service listings
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Detailed service description"
              rows={4}
              className={errors.description ? 'border-red-300' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing and Duration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing & Duration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register('price', { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.price ? 'border-red-300' : ''}
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Leave empty for "Contact for pricing"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                {...register('duration', { valueAsNumber: true })}
                placeholder="60"
                className={errors.duration ? 'border-red-300' : ''}
              />
              {errors.duration && (
                <p className="text-sm text-red-600">{errors.duration.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Estimated service duration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category and Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Category & Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...register('category')}
              placeholder="e.g., Consulting, Design, Development"
              list="categories"
              className={errors.category ? 'border-red-300' : ''}
            />
            <datalist id="categories">
              {categories.map(category => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              type="url"
              {...register('image')}
              placeholder="https://example.com/image.jpg"
              className={errors.image ? 'border-red-300' : ''}
            />
            {errors.image && (
              <p className="text-sm text-red-600">{errors.image.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label htmlFor="featured">Featured Service</Label>
              <p className="text-sm text-gray-500">
                Show this service prominently on the website
              </p>
            </div>
            <Switch
              id="featured"
              {...register('featured')}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label htmlFor="active">Active Service</Label>
              <p className="text-sm text-gray-500">
                Make this service available for booking
              </p>
            </div>
            <Switch
              id="active"
              {...register('active')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Service Features
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFeature}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Feature
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {watchedFeatures && watchedFeatures.length > 0 ? (
            <div className="space-y-2">
              {watchedFeatures.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={watchedFeatures[index] || ''}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Enter feature description"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFeature(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No features added yet. Click "Add Feature" to get started.
            </p>
          )}
          
          {watchedFeatures && watchedFeatures.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="flex flex-wrap gap-1">
                {watchedFeatures
                  .filter(feature => feature.trim())
                  .map((feature, index) => (
                    <Badge key={index} variant="outline">
                      {feature}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || loading}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting || loading}
          className="gap-2"
        >
          {isSubmitting || loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {isEditing ? 'Update Service' : 'Create Service'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// src/components/admin/services/BulkActionsPanel.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff, 
  Tag,
  DollarSign,
  X
} from 'lucide-react';
import { BulkAction } from '@/types/services';
import { validateBulkAction } from '@/lib/services/utils';

interface BulkActionsPanelProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkAction: (action: BulkAction) => Promise<void>;
  categories: string[];
  loading?: boolean;
}

export function BulkActionsPanel({
  selectedIds,
  onClearSelection,
  onBulkAction,
  categories,
  loading = false,
}: BulkActionsPanelProps) {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [categoryValue, setCategoryValue] = useState('');
  const [priceValue, setPriceValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkAction = async () => {
    if (!selectedAction || selectedIds.length === 0) return;

    let actionValue: string | number | undefined;
    
    if (selectedAction === 'category') {
      actionValue = categoryValue;
    } else if (selectedAction === 'price-update') {
      actionValue = parseFloat(priceValue);
    }

    const validation = validateBulkAction(selectedAction, selectedIds, actionValue);
    if (!validation.isValid) {
      alert(`Invalid action: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      setIsProcessing(true);
      await onBulkAction({
        action: selectedAction as any,
        serviceIds: selectedIds,
        value: actionValue,
      });
      
      // Reset form
      setSelectedAction('');
      setCategoryValue('');
      setPriceValue('');
    } finally {
      setIsProcessing(false);
    }
  };

  const needsValue = selectedAction === 'category' || selectedAction === 'price-update';
  const canExecute = selectedAction && selectedIds.length > 0 && 
    (!needsValue || (selectedAction === 'category' && categoryValue) || 
     (selectedAction === 'price-update' && priceValue && !isNaN(parseFloat(priceValue))));

  if (selectedIds.length === 0) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {selectedIds.length} service{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-blue-700 hover:text-blue-900"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Selection
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label>Bulk Action</Label>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Choose action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activate">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Activate Services
                  </div>
                </SelectItem>
                <SelectItem value="deactivate">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    Deactivate Services
                  </div>
                </SelectItem>
                <SelectItem value="feature">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Add to Featured
                  </div>
                </SelectItem>
                <SelectItem value="unfeature">
                  <div className="flex items-center gap-2">
                    <StarOff className="w-4 h-4" />
                    Remove from Featured
                  </div>
                </SelectItem>
                <SelectItem value="category">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Update Category
                  </div>
                </SelectItem>
                <SelectItem value="price-update">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Update Price
                  </div>
                </SelectItem>
                <SelectItem value="delete" className="text-red-600">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Services
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Input */}
          {selectedAction === 'category' && (
            <div className="space-y-2">
              <Label>New Category</Label>
              <Input
                value={categoryValue}
                onChange={(e) => setCategoryValue(e.target.value)}
                placeholder="Enter category name"
                list="bulk-categories"
              />
              <datalist id="bulk-categories">
                {categories.map(category => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
          )}

          {/* Price Input */}
          {selectedAction === 'price-update' && (
            <div className="space-y-2">
              <Label>New Price (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Empty columns for alignment */}
          {!needsValue && <div />}

          {/* Action Button */}
          <Button
            onClick={handleBulkAction}
            disabled={!canExecute || isProcessing || loading}
            variant={selectedAction === 'delete' ? 'destructive' : 'default'}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Apply Action'
            )}
          </Button>
        </div>

        {/* Action Preview */}
        {selectedAction && (
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <p className="text-sm text-gray-600">
              <strong>Preview:</strong> This will {getActionDescription(selectedAction, categoryValue, priceValue)} 
              {' '}{selectedIds.length} service{selectedIds.length !== 1 ? 's' : ''}.
              {selectedAction === 'delete' && (
                <span className="text-red-600 font-medium ml-1">
                  This action cannot be undone.
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getActionDescription(action: string, categoryValue?: string, priceValue?: string): string {
  switch (action) {
    case 'activate': return 'activate';
    case 'deactivate': return 'deactivate';
    case 'feature': return 'add to featured';
    case 'unfeature': return 'remove from featured';
    case 'category': return `change category to "${categoryValue}"`;
    case 'price-update': return `update price to ${priceValue}`;
    case 'delete': return 'delete';
    default: return 'modify';
  }
}