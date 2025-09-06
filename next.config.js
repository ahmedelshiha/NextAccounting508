/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ["localhost", "mydomain.com"],
  },
  turbopack: true,
}
module.exports = nextConfig
