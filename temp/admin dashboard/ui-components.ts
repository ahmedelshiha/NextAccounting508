// components/ui/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorId: Math.random().toString(36).substr(2, 9)
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Send error to monitoring service
    if (typeof window !== 'undefined') {
      try {
        // Replace with your error reporting service
        console.error('Error ID:', this.state.errorId, {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError)
      }
    }

    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorId: Math.random().toString(36).substr(2, 9)
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-red-200 bg-red-50 m-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-red-700 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={this.handleRetry} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-red-600 cursor-pointer">
                  Error Details (Dev)
                </summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// components/ui/DashboardSkeleton.tsx
import React from 'react'
import { Card, CardContent, CardHeader } from './card'

const SkeletonBox = ({ className }: { className?: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
)

const SkeletonText = ({ className }: { className?: string }) => (
  <div className={`bg-gray-200 rounded h-4 animate-pulse ${className}`} />
)

export const DashboardSkeleton = {
  KPIGrid: () => (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between">
        <SkeletonText className="w-64 h-6" />
        <SkeletonBox className="w-32 h-8" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <SkeletonBox className="w-10 h-10 rounded-lg" />
                <SkeletonBox className="w-12 h-4" />
              </div>
              <SkeletonText className="w-24 h-4" />
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <SkeletonText className="w-20 h-8" />
              <SkeletonBox className="w-full h-2" />
              <SkeletonText className="w-full h-3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  ),

  ActivityFeed: () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <SkeletonText className="w-32 h-5 mb-2" />
            <SkeletonText className="w-48 h-4" />
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBox key={i} className="w-16 h-8" />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="w-3 h-3 rounded-full" />
                  <SkeletonText className="w-32 h-4" />
                </div>
                <SkeletonText className="w-16 h-4" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <SkeletonText key={j} className="w-24 h-3" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ),

  SystemHealth: () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <SkeletonText className="w-28 h-5 mb-2" />
            <SkeletonText className="w-36 h-4" />
          </div>
          <div className="text-right">
            <SkeletonBox className="w-12 h-8 mb-1" />
            <SkeletonText className="w-20 h-3" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="w-4 h-4 rounded-full" />
                  <SkeletonText className="w-20 h-4" />
                </div>
                <SkeletonBox className="w-16 h-5" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ),

  BusinessIntelligence: () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <SkeletonText className="w-48 h-5 mb-2" />
            <SkeletonText className="w-64 h-4" />
          </div>
          <SkeletonBox className="w-32 h-8" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <SkeletonText className="w-40 h-5" />
            <SkeletonBox className="w-full h-64" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center">
                  <SkeletonText className="w-8 h-4 mx-auto mb-1" />
                  <SkeletonText className="w-16 h-3 mx-auto" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <SkeletonText className="w-36 h-5" />
            <SkeletonBox className="w-full h-64" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <SkeletonText className="w-32 h-3" />
                  <SkeletonText className="w-16 h-3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),

  Page: () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <SkeletonText className="w-64 h-8" />
              <SkeletonText className="w-96 h-4" />
            </div>
            <div className="flex gap-2">
              <SkeletonBox className="w-20 h-8" />
              <SkeletonBox className="w-20 h-8" />
              <SkeletonBox className="w-20 h-8" />
            </div>
          </div>
        </div>
        
        {/* KPI Grid Skeleton */}
        <DashboardSkeleton.KPIGrid />
        
        {/* Activity Feed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashboardSkeleton.ActivityFeed />
          </div>
          <div>
            <DashboardSkeleton.SystemHealth />
          </div>
        </div>
        
        {/* Business Intelligence */}
        <DashboardSkeleton.BusinessIntelligence />
      </div>
    </div>
  )
}

// components/ui/LoadingSpinner.tsx
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }
  
  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', 
        sizeClasses[size], 
        className
      )} 
    />
  )
}

// components/ui/VirtualList.tsx
import React, { useMemo, useRef, useCallback } from 'react'
import { useVirtualization } from '@/hooks/ui/useVirtualization'

interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscan = 5
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { visibleItems, totalHeight, handleScroll, offsetY } = useVirtualization(items, {
    itemHeight,
    containerHeight: height,
    overscan
  })

  const getItemStyle = useCallback((index: number) => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: itemHeight,
    transform: `translateY(${(index * itemHeight)}px)`
  }), [itemHeight])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={getItemStyle(index)}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// Export all components
export { ErrorBoundary, DashboardSkeleton, LoadingSpinner, VirtualList }