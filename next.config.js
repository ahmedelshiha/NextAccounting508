/** @type {import('next').NextConfig} */
const ALLOWED_DEV_ORIGINS = [
  "*.projects.builder.codes",
  "*.builder.codes",
  "*.builder.io",
  "*.netlify.app",
  "localhost:3000",
]

const nextConfig = {
  // Faster builds on CI (ESLint and TS typecheck are handled by separate scripts)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Smaller server bundle for Netlify and faster cold starts
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  images: {
    domains: ["localhost", "mydomain.com"],
  },

  // Allow Builder preview domains to access dev resources like /_next/* during development
  allowedDevOrigins: ALLOWED_DEV_ORIGINS,

  // Dev performance: optimize common packages and enable modularized imports
  experimental: {
    optimizePackageImports: [
      'date-fns',
      'lodash-es',
      'lucide-react',
      '@radix-ui/react-select',
      'react-chartjs-2',
      'chart.js',
    ],
  },
  modularizeImports: {
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
    'lodash-es': {
      transform: 'lodash-es/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/icons/{{member}}',
    },
  },

  // Turbopack is the default in Next 15; keep explicit block for clarity
  turbopack: {},

  // Fallback to webpack dev options if Turbopack is disabled
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduce file watching noise in dev if webpack is used
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/public/uploads/**',
          '**/dist/**',
        ],
      }
    }
    return config
  },
}

module.exports = nextConfig
