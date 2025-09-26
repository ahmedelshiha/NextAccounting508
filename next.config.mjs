import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  eslint: {
    // Skip ESLint checks during production builds to prevent build failures on lint-only issues
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["localhost", "mydomain.com"],
  },
  // Allow Builder preview domain to access dev resources like /_next/* during development
  allowedDevOrigins: ["*.projects.builder.codes", "*.fly.dev"],
  turbopack: {},
  
  // Webpack optimization for better bundle splitting
  webpack: (config, { isServer, buildId }) => {
    if (!isServer) {
      // Optimize chunk splitting for admin components
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate admin components into their own chunk
          adminComponents: {
            name: 'admin-components',
            test: /[\\/]src[\\/]components[\\/]admin[\\/]/,
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          // Admin hooks and utilities  
          adminUtils: {
            name: 'admin-utils',
            test: /[\\/]src[\\/](hooks|stores|types)[\\/]admin[\\/]/,
            chunks: 'all',
            priority: 9,
            enforce: true,
          },
          // UI components shared across the app
          uiComponents: {
            name: 'ui-components',
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            chunks: 'all',
            priority: 8,
          },
          // Zustand and other state management libraries
          stateManagement: {
            name: 'state-management',
            test: /[\\/]node_modules[\\/](zustand|react-query|swr)[\\/]/,
            chunks: 'all',
            priority: 7,
          },
          // Icon libraries
          icons: {
            name: 'icons',
            test: /[\\/]node_modules[\\/](lucide-react|heroicons)[\\/]/,
            chunks: 'all',
            priority: 6,
          },
        },
      }
    }
    
    return config
  },
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    swcMinify: true,
    // Enable React 18 Suspense features
    serverComponentsExternalPackages: ['@sentry/nextjs'],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src * data: blob:",
      "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://*.sentry.io https://*.netlify.app https://*.netlify.com",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, { silent: true, tunnelRoute: '/monitoring' })
