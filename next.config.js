/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ["localhost", "mydomain.com"],
  },
  turbopack: {},
}
module.exports = nextConfig
