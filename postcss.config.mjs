const isTest = process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'

let config

if (isTest) {
  // During tests we don't need PostCSS plugins — return empty plugin list to avoid loading Tailwind.
  config = { plugins: [] }
} else {
  const tailwindcss = (await import('tailwindcss')).default
  const autoprefixer = (await import('autoprefixer')).default
  config = { plugins: [tailwindcss(), autoprefixer()] }
}

export default config
