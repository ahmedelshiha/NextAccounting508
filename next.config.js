/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ["localhost", "mydomain.com"],
  },
  experimental: {
    turbo: true,
  },
}
module.exports = nextConfig
