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
  experimental: hasSvgr ? {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  } : {},

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

    return config
  },
}

module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), { silent: true })
