const isTest = process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'

let config

if (isTest) {
  // During tests we don't need PostCSS plugins — return empty plugin list to avoid loading Tailwind.
  config = { plugins: [] }
} else {
  config = { plugins: { '@tailwindcss/postcss': {}, 'autoprefixer': {} } }
}

export default config
