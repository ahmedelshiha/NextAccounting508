# Environment Variables — Task Management (dev workspace)

This document explains required environment variables for running the Task Management dev workspace and how to set them.

Required variables
- DATABASE_URL: Postgres connection string (used by Prisma/Neon/Supabase)
- NEXTAUTH_URL: Public URL for your Next.js app (e.g. http://localhost:3000)
- NEXTAUTH_SECRET: A secure random string used by NextAuth to sign cookies

Recommended variables
- SENDGRID_API_KEY: SendGrid API key for email sending (optional)
- NEON_URL / SUPABASE_URL: If using Neon or Supabase connections
- NEXT_PUBLIC_API_BASE: Base path for client-side API calls (defaults to /api)

Local development (recommended)
1. Copy .env.example to .env.local in `temp/task management`:
   cp .env.example .env.local
2. Replace placeholders with real values.
3. Start the dev server from inside `temp/task management/next-app` with:
   npm install
   npm run dev

Set vars in Builder / Deployment UI
- Use the Builder UI "Set env vars" or your hosting provider (Netlify, Vercel) to set the same variables. Never commit secrets to the repo.

Set vars via DevServerControl (maintainers)
- You can set env vars programmatically using the DevServerControl tool. Prefer this for secrets if you have access.

Security notes
- Never check real secret values into version control. Use environment or secret managers.
- Use strong secrets for NEXTAUTH_SECRET (32+ random bytes base64/urlsafe recommended).

If you'd like, I can prepare a secure example NEXTAUTH_SECRET and a script to bootstrap a local SQLite/Postgres dev DB. Tell me which DB you prefer (Neon/Postgres or Supabase or SQLite).
