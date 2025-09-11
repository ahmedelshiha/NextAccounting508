import { z } from 'zod'

const base = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_BUILDER_API_KEY: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NETLIFY_DATABASE_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

const parsed = base.safeParse(process.env)

if (!parsed.success && process.env.NODE_ENV === 'production') {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`)
}

export const env = parsed.success ? parsed.data : ({} as z.infer<typeof base>)
