import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target } from 'lucide-react';
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
                <p className="text-2xl font-bold text-gray-900">${totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(0) : '0'}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />Most Popular Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.popularServices.slice(0, 5).map((service, index) => (
                <div key={service.service} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">{index + 1}</div>
                    <span className="font-medium">{service.service}</span>
                  </div>
                  <Badge variant="outline">{service.bookings} bookings</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />Revenue by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.revenueByService.slice(0, 5).map((service, index) => (
                <div key={service.service} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-sm font-medium">{index + 1}</div>
                    <span className="font-medium">{service.service}</span>
                  </div>
                  <Badge variant="outline">${service.revenue.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Booking Trends (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.monthlyBookings.map((month) => {
              const maxBookings = Math.max(...analytics.monthlyBookings.map(m => m.bookings));
              const height = maxBookings > 0 ? (month.bookings / maxBookings) * 100 : 0;
              return (
                <div key={month.month} className="flex flex-col items-center gap-2 flex-1">
                  <div className="bg-blue-500 rounded-t-sm w-full transition-all duration-300 hover:bg-blue-600 relative" style={{ height: `${height}%` }}>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{month.bookings}</div>
                  </div>
                  <span className="text-xs text-gray-600 transform -rotate-45 whitespace-nowrap">{month.month}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
