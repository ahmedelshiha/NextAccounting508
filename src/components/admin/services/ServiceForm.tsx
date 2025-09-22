import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export function ServiceForm({ initialData, onSubmit, onCancel, loading = false, categories = [] }: ServiceFormProps) {
  const isEditing = !!initialData;
  const formSchema: z.ZodType<ServiceFormData, z.ZodTypeDef, ServiceFormData> = ServiceSchema as unknown as z.ZodType<ServiceFormData, z.ZodTypeDef, ServiceFormData>;
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ServiceFormData>({
    resolver: zodResolver(formSchema),
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

  React.useEffect(() => {
    if (!isEditing && watchedName) setValue('slug', generateSlug(watchedName));
  }, [watchedName, setValue, isEditing]);

  const addFeature = () => setValue('features', [ ...(watchedFeatures || []), '' ]);
  const updateFeature = (index: number, value: string) => {
    const cur = [...(watchedFeatures || [])]; cur[index] = value; setValue('features', cur);
  };
  const removeFeature = (index: number) => {
    const cur = [...(watchedFeatures || [])]; cur.splice(index, 1); setValue('features', cur);
  };

  const onFormSubmit = async (data: ServiceFormData) => {
    data.features = (data.features || []).filter(f => f.trim() !== '');
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5" />Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input id="name" {...register('name')} placeholder="Enter service name" className={errors.name ? 'border-red-300' : ''} />
              {errors.name && (<p className="text-sm text-red-600">{errors.name.message}</p>)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input id="slug" {...register('slug')} placeholder="url-friendly-slug" className={errors.slug ? 'border-red-300' : ''} />
              {errors.slug && (<p className="text-sm text-red-600">{errors.slug.message}</p>)}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortDesc">Short Description</Label>
            <Input id="shortDesc" {...register('shortDesc')} placeholder="Brief description for listings" className={errors.shortDesc ? 'border-red-300' : ''} />
            {errors.shortDesc && (<p className="text-sm text-red-600">{errors.shortDesc.message}</p>)}
            <p className="text-xs text-gray-500">Brief summary shown in service listings</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Full Description *</Label>
            <Textarea id="description" {...register('description')} placeholder="Detailed service description" rows={4} className={errors.description ? 'border-red-300' : ''} />
            {errors.description && (<p className="text-sm text-red-600">{errors.description.message}</p>)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />Pricing & Duration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input id="price" type="number" step="0.01" min="0" {...register('price', { valueAsNumber: true })} placeholder="0.00" className={errors.price ? 'border-red-300' : ''} />
              {errors.price && (<p className="text-sm text-red-600">{errors.price.message}</p>)}
              <p className="text-xs text-gray-500">Leave empty for &quot;Contact for pricing&quot;</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input id="duration" type="number" min="1" {...register('duration', { valueAsNumber: true })} placeholder="60" className={errors.duration ? 'border-red-300' : ''} />
              {errors.duration && (<p className="text-sm text-red-600">{errors.duration.message}</p>)}
              <p className="text-xs text-gray-500">Estimated service duration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />Category & Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...register('category')} placeholder="e.g., Consulting, Design, Development" list="categories" className={errors.category ? 'border-red-300' : ''} />
            <datalist id="categories">{categories.map(c => (<option key={c} value={c} />))}</datalist>
            {errors.category && (<p className="text-sm text-red-600">{errors.category.message}</p>)}
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" type="url" {...register('image')} placeholder="https://example.com/image.jpg" className={errors.image ? 'border-red-300' : ''} />
            {errors.image && (<p className="text-sm text-red-600">{errors.image.message}</p>)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="featured">Featured Service</Label>
              <input id="featured" type="checkbox" {...register('featured')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="active">Active Service</Label>
              <input id="active" type="checkbox" {...register('active')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Plus className="w-5 h-5" />Service Features</span>
            <Button type="button" variant="outline" size="sm" onClick={addFeature} className="gap-1"><Plus className="w-4 h-4" />Add Feature</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {watchedFeatures && watchedFeatures.length > 0 ? (
            <div className="space-y-2">
              {watchedFeatures.map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={watchedFeatures[i] || ''} onChange={(e) => updateFeature(i, e.target.value)} placeholder="Enter feature description" className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={() => removeFeature(i)} className="text-red-600 hover:text-red-700"><X className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No features added yet. Click &quot;Add Feature&quot; to get started.</p>
          )}
          {watchedFeatures && watchedFeatures.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="flex flex-wrap gap-1">
                {watchedFeatures.filter(f => f.trim()).map((f, i) => (<Badge key={i} variant="outline">{f}</Badge>))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || loading}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || loading} className="gap-2">
          {isSubmitting || loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{isEditing ? 'Updating...' : 'Creating...'}</>) : (<>{isEditing ? 'Update Service' : 'Create Service'}</>)}
        </Button>
      </div>
    </form>
  );
}
