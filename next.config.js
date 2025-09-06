/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ["localhost", "mydomain.com"],
  },
};
module.exports = nextConfig;
