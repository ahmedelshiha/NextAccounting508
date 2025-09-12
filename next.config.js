/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: false },
  images: { domains: ["localhost", "mydomain.com"] },
  // Allow Builder preview domain to access dev resources like /_next/* during development
  allowedDevOrigins: ["*.projects.builder.codes", "*.fly.dev"],
  turbopack: {},
}

module.exports = withSentryConfig(nextConfig)
