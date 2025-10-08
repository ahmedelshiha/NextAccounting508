import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Ensure Prisma has consistent DB URL regardless of environment (Netlify vs local)
// Canonical: DATABASE_URL. Mirror to the other variable for compatibility.
{
  let url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL
  if (url && url.startsWith('neon://')) url = url.replace('neon://', 'postgresql://')
  if (url) {
    if (!process.env.DATABASE_URL) process.env.DATABASE_URL = url
    if (!process.env.NETLIFY_DATABASE_URL) process.env.NETLIFY_DATABASE_URL = url
  }
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
})
