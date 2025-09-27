'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface AdminErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface AdminErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

/**
 * Enhanced Error Boundary for Admin Dashboard
 * Catches React errors including hydration mismatches
 */
class AdminErrorBoundary extends React.Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AdminErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error details
    console.error('Admin Dashboard Error:', error)
    console.error('Component Stack:', errorInfo.componentStack)
    
    // Check if it's a hydration error (React Error #185)
    if (error.message?.includes('Minified React error #185')) {
      console.error('🚨 HYDRATION MISMATCH DETECTED:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Admin Dashboard Loading Error
                </h1>
                <p className="text-sm text-gray-600">
                  There was an error loading the admin dashboard. Please try refreshing the page.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={this.resetError}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-red-50 rounded-md">
                <summary className="text-sm font-medium text-red-800 cursor-pointer">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 text-xs text-red-700">
                  <div className="font-medium">Error Message:</div>
                  <div className="mb-2 p-2 bg-red-100 rounded text-red-900 font-mono">
                    {this.state.error.message}
                  </div>
                  
                  {this.state.error.stack && (
                    <>
                      <div className="font-medium">Stack Trace:</div>
                      <pre className="mb-2 p-2 bg-red-100 rounded text-red-900 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <div className="font-medium">Component Stack:</div>
                      <pre className="p-2 bg-red-100 rounded text-red-900 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AdminErrorBoundary