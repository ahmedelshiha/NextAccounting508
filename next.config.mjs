import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    clientTraceMetadata: false,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }

    config.ignoreWarnings = [
      { module: /node_modules/ },
      { message: /Critical dependency/ },
    ]

    return config
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  productionBrowserSourceMaps: false,
  images: {
    domains: ['localhost', 'mydomain.com'],
    formats: ['image/webp'],
  },
  telemetry: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
  allowedDevOrigins: ['*.projects.builder.codes', '*.fly.dev'],
  turbopack: {},
}

export default withSentryConfig(nextConfig, { silent: true, tunnelRoute: '/monitoring' })
