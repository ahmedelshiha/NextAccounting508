import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Ensure Prisma has a DB URL regardless of environment (Netlify vs local)
if (!process.env.NETLIFY_DATABASE_URL && process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL
  if (url && url.startsWith('neon://')) url = url.replace('neon://', 'postgresql://')
  process.env.NETLIFY_DATABASE_URL = url as string
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
})
