// components/booking/new-booking/ServiceSelector.tsx
import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Target, TrendingUp, FileText, Eye, Info } from 'lucide-react'
import { Service } from '@/types'
import { ServiceCard } from '../shared/ServiceCard'

interface ServiceSelectorProps {
  services: Service[]
  selectedService?: Service
  onServiceSelect: (service: Service) => void
  categoryFilter: string
  onCategoryFilterChange: (category: string) => void
  loading?: boolean
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedService,
  onServiceSelect,
  categoryFilter,
  onCategoryFilterChange,
  loading = false
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating' | 'popular' | 'complexity'>('popular')
  const [showDetails, setShowDetails] = useState(true)
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'medium' | 'high'>('all')

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(services.map(s => s.category)))
    return ['all', ...uniqueCategories]
  }, [services])

  const filteredAndSortedServices = useMemo(() => {
    return services
      .filter(service => {
        // Category filter
        const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
        
        // Price range filter
        let matchesPrice = true
        if (priceRange !== 'all') {
          const price = service.price
          switch (priceRange) {
            case 'low':
              matchesPrice = price <= 100
              break
            case 'medium':
              matchesPrice = price > 100 && price <= 300
              break
            case 'high':
              matchesPrice = price > 300
              break
          }
        }
        
        return matchesCategory && matchesPrice
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price':
            return a.price - b.price
          case 'rating':
            return (b.rating || 0) - (a.rating || 0)
          case 'popular':
            return (b.completedCount || 0) - (a.completedCount || 0)
          case 'complexity':
            const complexityOrder = { basic: 1, intermediate: 2, advanced: 3 }
            return complexityOrder[a.complexity] - complexityOrder[b.complexity]
          default:
            return a.name.localeCompare(b.name)
        }
      })
  }, [services, categoryFilter, sortBy, priceRange])

  const getServiceStats = () => {
    const totalServices = filteredAndSortedServices.length
    const avgPrice = totalServices > 0 
      ? filteredAndSortedServices.reduce((sum, s) => sum + s.price, 0) / totalServices
      : 0
    const avgRating = totalServices > 0
      ? filteredAndSortedServices.reduce((sum, s) => sum + (s.rating || 0), 0) / totalServices
      : 0

    return { totalServices, avgPrice, avgRating }
  }

  const stats = getServiceStats()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Service Selection
            </CardTitle>
            <CardDescription>Choose the service for this appointment</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </div>

        {/* Service Statistics */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{stats.totalServices}</div>
            <div className="text-xs text-gray-600">Available Services</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">${stats.avgPrice.toFixed(0)}</div>
            <div className="text-xs text-gray-600">Average Price</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{stats.avgRating.toFixed(1)}</div>
            <div className="text-xs text-gray-600">Average Rating</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters and Sorting */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-gray-500" />
            
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={(value) => setPriceRange(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="low">$0 - $100</SelectItem>
                <SelectItem value="medium">$101 - $300</SelectItem>
                <SelectItem value="high">$300+</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price">Price Low-High</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="complexity">Complexity</SelectItem>
              </SelectContent>
            </Select>

            {(categoryFilter !== 'all' || priceRange !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onCategoryFilterChange('all')
                  setPriceRange('all')
                }}
                className="text-gray-500"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {categoryFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Category: {categoryFilter}
              </Badge>
            )}
            {priceRange !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Price: {priceRange}
              </Badge>
            )}
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-5 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedServices.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAndSortedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={onServiceSelect}
                isSelected={selectedService?.id === service.id}
                showDetails={showDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No services found</p>
            <p className="text-sm">Try adjusting your filters to see more options</p>
          </div>
        )}

        {/* Selected Service Details */}
        {selectedService && showDetails && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-3">
                  Selected: {selectedService.name}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Requirements */}
                  {selectedService.requirements && selectedService.requirements.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-blue-800 mb-2">Required Documents:</h5>
                      <ul className="space-y-1">
                        {selectedService.requirements.map((req, idx) => (
                          <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                            <span className="inline-block w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Deliverables */}
                  {selectedService.deliverables && selectedService.deliverables.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-blue-800 mb-2">What You'll Receive:</h5>
                      <ul className="space-y-1">
                        {selectedService.deliverables.map((deliverable, idx) => (
                          <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                            <span className="inline-block w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                            <span>{deliverable}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Prerequisites */}
                {selectedService.prerequisites && selectedService.prerequisites.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h5 className="text-sm font-medium text-yellow-800 mb-1">Prerequisites:</h5>
                    <p className="text-sm text-yellow-700">
                      {selectedService.prerequisites.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ServiceSelector