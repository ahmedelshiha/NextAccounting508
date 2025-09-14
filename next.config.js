/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Keep ESLint in dev, but don't fail production builds on lint errors
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["localhost", "mydomain.com"],
  },
  // Allow Builder preview domain to access dev resources like /_next/* during development
  allowedDevOrigins: ["*.projects.builder.codes", "*.fly.dev"],
  turbopack: {},
}
module.exports = nextConfig
