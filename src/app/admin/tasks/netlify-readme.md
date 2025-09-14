# Netlify Deploy — Task Management (temp workspace)

This document explains how to deploy the temp task management workspace to Netlify and which environment variables are required.

Recommended repo structure
- The temp workspace contains a minimal Next.js app under `temp/task management/next-app`.
- Netlify will run the build from that folder using the configuration in `netlify.toml`.

How to connect and deploy
1. Push your branch to GitHub (use the UI "Push Code" button).
2. In Netlify, create a new site from Git and connect the repository and branch.
3. In Site settings → Build & deploy, set the base directory to `temp/task management/next-app` (Netlify UI expects path without a leading slash).
4. Netlify will use the `build.command` in netlify.toml which runs `npm ci && npm run build` in the `next-app` folder.
5. Ensure the Next.js plugin for Netlify is enabled (netlify.toml includes `@netlify/plugin-nextjs`).

Required environment variables (set in Netlify UI -> Site Settings -> Build & deploy -> Environment)
- DATABASE_URL: Postgres connection string for Prisma/Neon/Supabase
- NEXTAUTH_URL: Public site URL (e.g. https://your-site.netlify.app)
- NEXTAUTH_SECRET: Long random secret for NextAuth
- NEXT_PUBLIC_API_BASE: Base path for client-side API calls (default: /api)
- SENDGRID_API_KEY: (optional) for email notifications
- NEON_URL / SUPABASE_URL / SUPABASE_ANON_KEY: (optional) if using those MCPs

Runtime notes
- Next.js App Router requires serverless support. Netlify uses the Next.js plugin to handle SSR/edge functions. Ensure the plugin is present in your Netlify account.
- If your app uses Prisma, a proper DATABASE_URL must be available at build/time for `prisma generate` and at runtime if you use server-side rendering that accesses the database.

Local preview
- You can preview the same build locally by running from `temp/task management/next-app`:
  npm ci
  npm run build
  npm run start

Security
- Never commit real secrets to the repo. Use Netlify's environment variable UI or secret store.

If you want, I can also add a small GitHub Actions workflow to push to Netlify or wire up deploy previews automatically. Would you like that? (I'll proceed automatically if you prefer.)
