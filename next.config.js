const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: false },
  images: { domains: ["localhost", "mydomain.com"] },
  // Allow Builder preview domain to access dev resources like /_next/* during development
  allowedDevOrigins: ["*.projects.builder.codes", "*.fly.dev"],
  turbopack: {},
}

const isProd = process.env.NODE_ENV === 'production'
module.exports = isProd
  ? withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true })
  : nextConfig
