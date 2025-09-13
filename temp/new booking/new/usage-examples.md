# Enhanced Booking System - Implementation Guide

## Quick Start

### 1. Basic Setup

```tsx
// pages/admin/bookings/new.tsx
import { BookingProvider } from '@/contexts/BookingContext'
import NewBookingPage from '@/components/booking/new-booking/NewBookingPage'

export default function NewBooking() {
  return <NewBookingPage />
}
```

### 2. Using Individual Components

```tsx
// Custom booking flow with individual components
import { useState } from 'react'
import { ClientSelector, ServiceSelector } from '@/components/booking'
import { useClients, useServices } from '@/hooks'

export default function CustomBookingFlow() {
  const { clients } = useClients()
  const { services } = useServices()
  const [selectedClient, setSelectedClient] = useState()
  
  return (
    <div className="space-y-6">
      <ClientSelector
        clients={clients}
        selectedClient={selectedClient}
        onClientSelect={setSelectedClient}
        isNewClient={false}
        onNewClientToggle={() => {}}
        searchTerm=""
        onSearchChange={() => {}}
      />
      
      <ServiceSelector
        services={services}
        selectedService={undefined}
        onServiceSelect={() => {}}
        categoryFilter="all"
        onCategoryFilterChange={() => {}}
      />
    </div>
  )
}
```

### 3. Custom Hook Usage

```tsx
// Using data hooks in your components
import { useBookings, useClients } from '@/hooks'

export default function BookingsDashboard() {
  const { createBooking, loading } = useBookings()
  const { clients, createClient } = useClients()
  
  const handleBookingSubmit = async (data) => {
    try {
      const booking = await createBooking(data)
      console.log('Booking created:', booking)
    } catch (error) {
      console.error('Failed to create booking:', error)
    }
  }
  
  return (
    <div>
      {/* Your dashboard content */}
    </div>
  )
}
```

## Component Examples

### Client Management

```tsx
// Advanced client filtering and management
import { useState, useMemo } from 'react'
import { ClientCard } from '@/components/booking/shared'
import { useClients, useDebounce } from '@/hooks'

export default function ClientManagement() {
  const { clients, loading } = useClients()
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesTier = tierFilter === 'all' || client.tier === tierFilter
      return matchesSearch && matchesTier
    })
  }, [clients, debouncedSearch, tierFilter])
  
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search clients..."
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Tiers</option>
          <option value="individual">Individual</option>
          <option value="smb">SMB</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => (
          <ClientCard
            key={client.id}
            client={client}
            onClick={(client) => console.log('Selected:', client)}
            showStats={true}
          />
        ))}
      </div>
    </div>
  )
}
```

### Service Catalog

```tsx
// Service catalog with advanced features
import { useState } from 'react'
import { ServiceCard } from '@/components/booking/shared'
import { useServices } from '@/hooks'
import { formatCurrency } from '@/utils/formatting'

export default function ServiceCatalog() {
  const { services, loading } = useServices()
  const [category, setCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  
  const categories = ['all', ...new Set(services.map(s => s.category))]
  
  const filteredServices = services.filter(service => {
    const matchesCategory = category === 'all' || service.category === category
    
    let matchesPrice = true
    if (priceRange !== 'all') {
      const price = service.price
      switch (priceRange) {
        case 'low': matchesPrice = price <= 100; break
        case 'medium': matchesPrice = price > 100 && price <= 300; break
        case 'high': matchesPrice = price > 300; break
      }
    }
    
    return matchesCategory && matchesPrice
  })
  
  return (
    <div className="space-y-6">
      {/* Service Statistics */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold">{filteredServices.length}</div>
          <div className="text-sm text-gray-600">Available Services</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(filteredServices.reduce((sum, s) => sum + s.price, 0) / filteredServices.length)}
          </div>
          <div className="text-sm text-gray-600">Average Price</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {(filteredServices.reduce((sum, s) => sum + (s.rating || 0), 0) / filteredServices.length).toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        
        <select
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Prices</option>
          <option value="low">Under $100</option>
          <option value="medium">$100 - $300</option>
          <option value="high">Over $300</option>
        </select>
      </div>
      
      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            onClick={(service) => console.log('Selected:', service)}
            showDetails={true}
          />
        ))}
      </div>
    </div>
  )
}
```

### Staff Scheduling

```tsx
// Staff scheduling with availability
import { useState } from 'react'
import { StaffCard } from '@/components/booking/shared'
import { useStaff } from '@/hooks'

export default function StaffScheduling() {
  const { staff, updateStaffAvailability } = useStaff()
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  
  const filteredStaff = staff.filter(member => {
    const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter
    const matchesAvailability = availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && member.isAvailable) ||
      (availabilityFilter === 'busy' && !member.isAvailable)
    
    return matchesDepartment && matchesAvailability
  })
  
  const handleAvailabilityToggle = async (staffId: string, isAvailable: boolean) => {
    try {
      await updateStaffAvailability(staffId, isAvailable)
    } catch (error) {
      console.error('Failed to update availability:', error)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Departments</option>
          <option value="tax">Tax</option>
          <option value="audit">Audit</option>
          <option value="consulting">Consulting</option>
          <option value="bookkeeping">Bookkeeping</option>
          <option value="advisory">Advisory</option>
        </select>
        
        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Staff</option>
          <option value="available">Available Only</option>
          <option value="busy">Busy Only</option>
        </select>
      </div>
      
      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(member => (
          <div key={member.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.role}</p>
              </div>
              <button
                onClick={() => handleAvailabilityToggle(member.id, !member.isAvailable)}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  member.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {member.isAvailable ? 'Available' : 'Busy'}
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <strong>Specialties:</strong> {member.specialties.slice(0, 2).join(', ')}
                {member.specialties.length > 2 && ` +${member.specialties.length - 2}`}
              </div>
              <div>
                <strong>Rating:</strong> {member.rating}/5 ({member.completedBookings} completed)
              </div>
              <div>
                <strong>Rate:</strong> ${member.hourlyRate}/hr
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Advanced Usage Patterns

### Custom Validation

```tsx
// Custom form validation with the booking system
import { validateForm, bookingSchema } from '@/utils/validation'

export default function BookingFormWithValidation() {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  
  const handleSubmit = () => {
    const validation = validateForm(bookingSchema, formData)
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }
    
    // Process valid form data
    console.log('Valid data:', validation.data)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with error display */}
      {errors.clientName && (
        <div className="text-red-600 text-sm">{errors.clientName}</div>
      )}
    </form>
  )
}
```

### Real-time Updates

```tsx
// Real-time booking updates with WebSocket or polling
import { useEffect } from 'react'
import { useBookings } from '@/hooks'

export default function RealTimeBookings() {
  const { bookings, loading, refreshBookings } = useBookings()
  
  useEffect(() => {
    // Polling for updates every 30 seconds
    const interval = setInterval(refreshBookings, 30000)
    return () => clearInterval(interval)
  }, [refreshBookings])
  
  return (
    <div>
      {loading && <div>Refreshing...</div>}
      {/* Booking list */}
    </div>
  )
}
```

## Performance Optimization

### Lazy Loading

```tsx
// Lazy load heavy components
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/booking/shared'

const BookingReview = lazy(() => import('@/components/booking/new-booking/BookingReview'))
const ServiceSelector = lazy(() => import('@/components/booking/new-booking/ServiceSelector'))

export default function OptimizedBookingFlow() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ServiceSelector {...props} />
      <BookingReview {...props} />
    </Suspense>
  )
}
```

### Memoization

```tsx
// Optimize expensive calculations
import { useMemo } from 'react'

export default function OptimizedServiceList({ services, filters }) {
  const filteredServices = useMemo(() => {
    return services
      .filter(service => {
        // Complex filtering logic
        return applyFilters(service, filters)
      })
      .sort((a, b) => {
        // Complex sorting logic
        return compareServices(a, b)
      })
  }, [services, filters])
  
  return (
    <div>
      {filteredServices.map(service => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  )
}
```

## Testing Examples

### Component Testing

```tsx
// Test individual components
import { render, screen } from '@testing-library/react'
import { ClientCard } from '@/components/booking/shared'

test('displays client information correctly', () => {
  const mockClient = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    tier: 'individual',
    totalBookings: 5
  }
  
  render(<ClientCard client={mockClient} />)
  
  expect(screen.getByText('John Doe')).toBeInTheDocument()
  expect(screen.getByText('john@example.com')).toBeInTheDocument()
  expect(screen.getByText('5 bookings')).toBeInTheDocument()
})
```

### Hook Testing

```tsx
// Test custom hooks
import { renderHook, act } from '@testing-library/react'
import { useClients } from '@/hooks'

test('fetches clients on mount', async () => {
  const { result } = renderHook(() => useClients())
  
  expect(result.current.loading).toBe(true)
  
  await act(async () => {
    // Wait for the hook to finish loading
  })
  
  expect(result.current.loading).toBe(false)
  expect(result.current.clients).toHaveLength(5)
})
```

This comprehensive system provides:

1. **Modular Architecture** - Each component has a single responsibility
2. **Type Safety** - Full TypeScript coverage with strict types
3. **Performance Optimization** - Lazy loading, memoization, and efficient renders
4. **Professional Features** - Advanced filtering, sorting, real-time updates
5. **Excellent DX** - Clear documentation, examples, and testing patterns
6. **Scalability** - Easy to extend with new features and components
7. **Accessibility** - WCAG compliant with proper ARIA labels and keyboard navigation

## Deployment and Production Considerations

### Environment Setup

```bash
# Install dependencies
npm install

# Development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test

# Build for production
npm run build
```

### Production Optimizations

```tsx
// Implement proper error boundaries
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

export default function ProductionApp() {
  return (
    <ErrorBoundary>
      <BookingProvider>
        <NewBookingPage />
      </BookingProvider>
    </ErrorBoundary>
  )
}
```

### Monitoring and Analytics

```tsx
// Add performance monitoring
import { trackEvent, trackError } from '@/utils/analytics'

export function useBookingAnalytics() {
  const trackBookingCreated = (booking: BookingDetail) => {
    trackEvent('booking_created', {
      service_category: booking.service.category,
      client_tier: booking.client.tier,
      location: booking.location,
      value: booking.service.price
    })
  }
  
  const trackError = (error: Error, context: string) => {
    trackError(error, { context, timestamp: new Date().toISOString() })
  }
  
  return { trackBookingCreated, trackError }
}
```

## Security Considerations

### Data Validation

```tsx
// Server-side validation example
import { z } from 'zod'

const createBookingSchema = z.object({
  clientId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  location: z.enum(['office', 'remote', 'client_site']),
  notes: z.string().max(1000).optional(),
})

export async function createBookingHandler(req, res) {
  try {
    const validatedData = createBookingSchema.parse(req.body)
    // Process validated data
  } catch (error) {
    return res.status(400).json({ error: 'Invalid data' })
  }
}
```

### Authentication Integration

```tsx
// Auth context integration
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedBookingPage() {
  const { user, isAuthenticated, hasRole } = useAuth()
  
  if (!isAuthenticated) {
    return <LoginRedirect />
  }
  
  if (!hasRole(['admin', 'staff'])) {
    return <UnauthorizedMessage />
  }
  
  return <NewBookingPage />
}
```

## Troubleshooting Guide

### Common Issues

1. **Component Not Updating**
   ```tsx
   // Ensure proper dependency arrays in useEffect
   useEffect(() => {
     fetchData()
   }, [dependency1, dependency2]) // Include all dependencies
   ```

2. **Type Errors**
   ```tsx
   // Use proper type assertions
   const booking = data as BookingDetail
   // Or type guards
   if (isBookingDetail(data)) {
     // TypeScript now knows data is BookingDetail
   }
   ```

3. **Performance Issues**
   ```tsx
   // Implement proper memoization
   const expensiveCalculation = useMemo(() => {
     return heavyComputation(data)
   }, [data])
   
   const MemoizedComponent = React.memo(MyComponent, (prevProps, nextProps) => {
     return prevProps.id === nextProps.id
   })
   ```

### Development Tips

- Use React Developer Tools for debugging component state
- Implement proper loading states for better UX
- Add proper error boundaries to catch and display errors gracefully
- Use TypeScript strict mode for better type safety
- Implement proper testing strategies for critical user flows

This modular architecture allows for easy maintenance, testing, and scaling while providing a professional-grade booking system suitable for service-based businesses.