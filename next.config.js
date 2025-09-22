/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

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
}

module.exports = withSentryConfig(nextConfig, { silent: true })
