/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: false },
  images: { domains: ["localhost", "mydomain.com"] },
  // Allow Builder preview domain to access dev resources like /_next/* during development
  allowedDevOrigins: ["*.projects.builder.codes", "*.fly.dev"],
  turbopack: {},
}

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  // Defer requiring Sentry to production only to speed up dev startup
  const { withSentryConfig } = require('@sentry/nextjs')
  module.exports = withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true })
} else {
  module.exports = nextConfig
}
