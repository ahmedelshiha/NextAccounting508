// components/booking/shared/StatusBadge.tsx
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { BookingDetail } from '@/types'

interface StatusBadgeProps {
  status: BookingDetail['status']
  size?: 'sm' | 'md' | 'lg'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'CONFIRMED':
        return { className: 'bg-green-100 text-green-800', text: 'Confirmed' }
      case 'COMPLETED':
        return { className: 'bg-blue-100 text-blue-800', text: 'Completed' }
      case 'CANCELLED':
        return { className: 'bg-red-100 text-red-800', text: 'Cancelled' }
      case 'NO_SHOW':
        return { className: 'bg-gray-100 text-gray-800', text: 'No Show' }
      case 'PENDING':
      default:
        return { className: 'bg-yellow-100 text-yellow-800', text: 'Pending' }
    }
  }

  const config = getStatusConfig()
  const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'

  return (
    <Badge className={`${config.className} ${sizeClass}`}>
      {config.text}
    </Badge>
  )
}

// components/booking/shared/PriorityBadge.tsx
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Flag, Minus } from 'lucide-react'
import { BookingDetail } from '@/types'

interface PriorityBadgeProps {
  priority?: BookingDetail['priority']
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority = 'normal', 
  showIcon = true, 
  size = 'md' 
}) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'urgent':
        return {
          className: 'bg-red-100 text-red-800 border-red-200',
          text: 'Urgent',
          icon: AlertTriangle
        }
      case 'high':
        return {
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          text: 'High',
          icon: Flag
        }
      case 'normal':
      default:
        return {
          className: 'bg-gray-100 text-gray-600 border-gray-200',
          text: 'Normal',
          icon: Minus
        }
    }
  }

  const config = getPriorityConfig()
  const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'
  const IconComponent = config.icon

  if (priority === 'normal') return null

  return (
    <Badge variant="outline" className={`${config.className} ${sizeClass} flex items-center gap-1`}>
      {showIcon && <IconComponent className="h-3 w-3" />}
      {config.text}
    </Badge>
  )
}

// components/booking/shared/LocationIndicator.tsx
import React from 'react'
import { Building, Globe, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BookingDetail } from '@/types'

interface LocationIndicatorProps {
  location: BookingDetail['location']
  showIcon?: boolean
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const LocationIndicator: React.FC<LocationIndicatorProps> = ({ 
  location = 'office', 
  showIcon = true, 
  showText = true, 
  size = 'md' 
}) => {
  const getLocationConfig = () => {
    switch (location) {
      case 'remote':
        return {
          icon: Globe,
          text: 'Remote',
          className: 'bg-blue-100 text-blue-800'
        }
      case 'client_site':
        return {
          icon: MapPin,
          text: 'Client Site',
          className: 'bg-purple-100 text-purple-800'
        }
      case 'office':
      default:
        return {
          icon: Building,
          text: 'Office',
          className: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const config = getLocationConfig()
  const IconComponent = config.icon
  const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'

  return (
    <Badge variant="outline" className={`${config.className} ${sizeClass} flex items-center gap-1`}>
      {showIcon && <IconComponent className="h-3 w-3" />}
      {showText && config.text}
    </Badge>
  )
}

// components/booking/shared/RatingStars.tsx
import React from 'react'
import { Star } from 'lucide-react'

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  className?: string
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const starSize = sizeClasses[size]

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < Math.floor(rating)
              ? 'text-yellow-500 fill-current'
              : i < rating
              ? 'text-yellow-500 fill-yellow-200'
              : 'text-gray-300'
          }`}
        />
      ))}
      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  )
}

// components/booking/shared/LoadingSpinner.tsx
import React from 'react'
import { RefreshCw } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const spinnerSize = sizeClasses[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <RefreshCw className={`${spinnerSize} animate-spin text-blue-500`} />
      {text && <span className="text-gray-600">{text}</span>}
    </div>
  )
}

// components/booking/shared/ClientCard.tsx
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, DollarSign, Mail, Phone, Star, Users } from 'lucide-react'
import { Client } from '@/types'
import { RatingStars } from './RatingStars'

interface ClientCardProps {
  client: Client
  onClick?: (client: Client) => void
  isSelected?: boolean
  showStats?: boolean
  className?: string
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onClick,
  isSelected = false,
  showStats = true,
  className = ''
}) => {
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise': return <Building className="h-3 w-3" />
      case 'smb': return <Users className="h-3 w-3" />
      default: return <Users className="h-3 w-3" />
    }
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      } ${className}`}
      onClick={() => onClick?.(client)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Client Header */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-gray-900">{client.name}</h3>
              <div className="flex items-center gap-1">
                {getTierIcon(client.tier)}
                <Badge
                  variant={
                    client.tier === 'enterprise' ? 'default' : 
                    client.tier === 'smb' ? 'secondary' : 'outline'
                  }
                  className="text-xs"
                >
                  {client.tier.toUpperCase()}
                </Badge>
                {client.riskLevel && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getRiskBadgeColor(client.riskLevel)}`}
                  >
                    {client.riskLevel} risk
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-3 w-3" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.company && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-3 w-3" />
                  <span>{client.company}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {client.tags && client.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {client.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {client.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{client.tags.length - 3} more</span>
                )}
              </div>
            )}
          </div>

          {/* Client Stats */}
          {showStats && (
            <div className="text-right text-sm space-y-1">
              <div className="flex items-center gap-1 text-green-600">
                <DollarSign className="h-3 w-3" />
                <span>${client.totalSpent || 0}</span>
              </div>
              <div className="text-gray-600">
                {client.totalBookings} bookings
              </div>
              {client.averageRating && (
                <RatingStars rating={client.averageRating} size="sm" />
              )}
              {client.lastBooking && (
                <div className="text-xs text-gray-500">
                  Last: {new Date(client.lastBooking).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// components/booking/shared/ServiceCard.tsx
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, DollarSign, Star, Timer } from 'lucide-react'
import { Service } from '@/types'
import { RatingStars } from './RatingStars'

interface ServiceCardProps {
  service: Service
  onClick?: (service: Service) => void
  isSelected?: boolean
  showDetails?: boolean
  className?: string
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onClick,
  isSelected = false,
  showDetails = true,
  className = ''
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tax': return 'bg-green-100 text-green-800'
      case 'audit': return 'bg-blue-100 text-blue-800'
      case 'consulting': return 'bg-purple-100 text-purple-800'
      case 'bookkeeping': return 'bg-orange-100 text-orange-800'
      case 'advisory': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'advanced': return 'bg-red-100 text-red-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300'
      } ${className}`}
      onClick={() => onClick?.(service)}
    >
      <CardContent className="p-5">
        {/* Service Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-base">{service.name}</h3>
            {service.isPopular && (
              <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Popular
              </Badge>
            )}
          </div>
          <Badge className={`text-xs ${getCategoryColor(service.category)}`}>
            {service.category}
          </Badge>
        </div>

        {/* Rating and Stats */}
        {showDetails && (
          <div className="flex items-center gap-4 mb-3 text-sm">
            {service.rating && (
              <RatingStars rating={service.rating} size="sm" showNumber />
            )}
            {service.completedCount && (
              <div className="flex items-center gap-1 text-gray-600">
                <CheckCircle className="h-4 w-4" />
                <span>{service.completedCount} completed</span>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>

        {/* Service Details Grid */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{service.duration} min</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="font-medium">${service.price}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-gray-400" />
              <span>{service.estimatedHours}h est.</span>
            </div>
            <div>
              <Badge 
                variant="outline" 
                className={`text-xs ${getComplexityColor(service.complexity)}`}
              >
                {service.complexity}
              </Badge>
            </div>
          </div>
        )}

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {service.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {service.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{service.tags.length - 3} more</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}