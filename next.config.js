/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

let withBundleAnalyzer = (cfg) => cfg
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })
} catch {}

const hasSvgr = (() => { try { require.resolve('@svgr/webpack'); return true } catch { return false } })()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  swcMinify: true,
  eslint: { ignoreDuringBuilds: false },
  images: { domains: ["localhost", "mydomain.com"] },
  // Allow Builder preview domain to access dev resources like /_next/* during development
  allowedDevOrigins: ["*.projects.builder.codes", "*.fly.dev"],
  turbopack: {},

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },

  // Enable experimental features for better performance
  experimental: {
    turbo: hasSvgr ? {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    } : {}
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next'],
      }
      config.resolve.symlinks = false
      config.resolve.cacheWithContext = false
    }

    // Optimize bundle splitting
    if (!isServer) {
      config.optimization = config.optimization || {}
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
      }
    }

    // SVGR for webpack fallback when available
    if (hasSvgr) {
      config.module.rules.push({
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: [
          {
            loader: require.resolve('@svgr/webpack'),
            options: { svgo: true },
          },
        ],
      })
    }

    // Silence noisy Sentry/OpenTelemetry critical dependency warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Critical dependency: the request of a dependency is an expression/,
    ]

    return config
  },
}

const enableSentryUpload = process.env.SENTRY_UPLOAD_SOURCEMAPS === 'true' && !!process.env.SENTRY_AUTH_TOKEN && !!process.env.SENTRY_ORG && !!process.env.SENTRY_PROJECT

const finalConfig = withBundleAnalyzer(nextConfig)

module.exports = enableSentryUpload
  ? withSentryConfig(finalConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
    })
  : finalConfig
