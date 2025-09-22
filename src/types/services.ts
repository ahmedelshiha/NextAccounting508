export interface Service {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDesc?: string | null;
  features: string[];
  price?: number | null;
  duration?: number | null;
  category?: string | null;
  featured: boolean;
  active: boolean;
  views?: number;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  tenantId?: string | null;
}

export interface ServiceFormData {
  name: string;
  slug: string;
  description: string;
  shortDesc?: string;
  features: string[];
  price?: number | null;
  duration?: number | null;
  category?: string;
  featured: boolean;
  active: boolean;
  image?: string;
}

export interface ServiceFilters {
  search: string;
  category: 'all' | string;
  featured: 'all' | 'featured' | 'non-featured';
  status: 'all' | 'active' | 'inactive';
}

export interface ServiceStats {
  total: number;
  active: number;
  featured: number;
  categories: number;
  averagePrice: number;
  totalRevenue: number;
}

export interface ServiceAnalytics {
  monthlyBookings: { month: string; bookings: number }[];
  revenueByService: { service: string; revenue: number }[];
  popularServices: { service: string; bookings: number }[];
  conversionRates: { service: string; rate: number }[];
  // Per-service monthly revenue time-series for top services
  revenueTimeSeries?: { service: string; monthly: { month: string; revenue: number }[] }[];
  conversionsByService?: { service: string; bookings: number; views: number; conversionRate: number }[];
}

export interface BulkAction {
  action: 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'delete' | 'category' | 'price-update' | 'clone' | 'settings-update';
  serviceIds: string[];
  value?: string | number | Record<string, any> | undefined;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  affectedServices: number;
}
