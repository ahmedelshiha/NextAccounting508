export type ServiceStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DEPRECATED' | 'RETIRED';

export type ServiceFeaturedFilter = 'all' | 'featured' | 'non-featured';

export type ServiceStatusFilter = 'all' | 'active' | 'inactive' | 'draft' | 'deprecated' | 'retired';

export type ServiceSortField = 'name' | 'price' | 'createdAt' | 'updatedAt' | 'views' | 'bookings';

export interface ServiceOperationalMetrics {
  bookings?: number;
  revenue?: number;
  conversionRate?: number;
  rating?: number;
  lastBookingAt?: string | null;
}

export interface ServiceSchedulingSettings {
  bookingEnabled?: boolean;
  advanceBookingDays?: number;
  minAdvanceHours?: number;
  maxDailyBookings?: number | null;
  bufferTime?: number;
  businessHours?: Record<string, unknown> | null;
  blackoutDates?: string[];
}

export interface Service {
  id: string;
  tenantId?: string | null;
  slug: string;
  name: string;
  description: string;
  shortDesc?: string | null;
  features: string[];
  category?: string | null;
  price?: number | null;
  basePrice?: number | null;
  currency?: string | null;
  duration?: number | null;
  estimatedDurationHours?: number | null;
  requiredSkills?: string[];
  featured: boolean;
  active: boolean;
  status?: ServiceStatus;
  serviceSettings?: Record<string, unknown> | null;
  metrics?: ServiceOperationalMetrics;
  views?: number;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: ServiceSchedulingSettings;
}

export interface ServiceSummary extends Service {
  bookingsCount?: number;
  totalRevenue?: number;
  conversionRate?: number;
}

export interface ServiceDetail extends Service {
  history?: Array<{ id: string; label: string; createdAt: string; createdBy?: string }>;
  recentBookings?: Array<{ id: string; scheduledAt: string; clientName: string; status: string }>;
}

export interface ServiceLite {
  id: string;
  name: string;
  shortDesc?: string | null;
  price?: number | null;
  duration?: number | null;
}

export interface ServiceFormData {
  name: string;
  slug: string;
  description: string;
  shortDesc?: string | null;
  features: string[];
  price?: number | null;
  basePrice?: number | null;
  duration?: number | null;
  estimatedDurationHours?: number | null;
  category?: string | null;
  currency?: string | null;
  featured: boolean;
  active: boolean;
  status?: ServiceStatus;
  image?: string | null;
  bookingEnabled?: boolean;
  advanceBookingDays?: number | null;
  minAdvanceHours?: number | null;
  maxDailyBookings?: number | null;
  bufferTime?: number | null;
  requiredSkills?: string[];
  serviceSettings?: Record<string, unknown> | null;
  blackoutDates?: string[];
  businessHours?: Record<string, unknown> | null;
}

export interface ServiceFilters {
  search?: string;
  category?: 'all' | string | null;
  featured?: ServiceFeaturedFilter;
  status?: ServiceStatusFilter;
  minPrice?: number | null;
  maxPrice?: number | null;
  tags?: string[];
  requiredSkills?: string[];
  bookingEnabled?: boolean | null;
  currency?: string | null;
}

export interface ServiceListParams extends ServiceFilters {
  limit?: number;
  offset?: number;
  sortBy?: ServiceSortField;
  sortOrder?: 'asc' | 'desc';
  tenantId?: string | null;
}

export interface ServiceListResponse {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceStats {
  total: number;
  active: number;
  featured: number;
  categories: number;
  averagePrice: number;
  totalRevenue: number;
  inactive?: number;
  draft?: number;
  deprecated?: number;
}

export interface ServiceAnalytics {
  monthlyBookings: { month: string; bookings: number }[];
  revenueByService: { service: string; revenue: number }[];
  popularServices: { service: string; bookings: number }[];
  conversionRates: { service: string; rate: number }[];
  revenueTimeSeries?: { service: string; monthly: { month: string; revenue: number }[] }[];
  conversionsByService?: { service: string; bookings: number; views: number; conversionRate: number }[];
  viewsByService?: { service: string; views: number }[];
}

export type ServiceBulkActionType =
  | 'activate'
  | 'deactivate'
  | 'feature'
  | 'unfeature'
  | 'delete'
  | 'category'
  | 'price-update'
  | 'clone'
  | 'settings-update';

export interface BulkAction {
  action: ServiceBulkActionType;
  serviceIds: string[];
  value?: string | number | Record<string, unknown>;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  affectedServices: number;
}
