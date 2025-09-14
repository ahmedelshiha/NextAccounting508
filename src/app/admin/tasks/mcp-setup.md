# MCP & GitHub Setup — Task Management (dev workspace)

This document describes the minimal steps to connect the development workspace to GitHub and Builder.io (and other useful MCP integrations). You must perform MCP connections manually using the Builder platform UI.

Step 1: Link the repository (GitHub)
- Create or choose a GitHub repository for this project (e.g. ahmedelshiha/NextAccounting47).
- Push your branch (ai_main_2e208302ecb9) from the local environment using the top-right "Push Code" button in the Builder UI or your git client.
- Once pushed, create a Pull Request for integration or CI workflows as needed.

Step 2: Connect Builder.io (required for CMS / visual content)
- Open the MCP popover in the Builder UI: [Open MCP popover](#open-mcp-popover)
- Click "Connect to Builder.io" and follow the prompted OAuth flow to authorize access.
- After connecting, configure models and assets in the Builder.io integration to map pages or content models used by the task system.

Recommended MCP integrations (how they help this task system)
- Builder.io — content management, templates, page models, assets. (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Builder.io)
- Neon — serverless Postgres DB for task storage and auth. (Use cases: database management; Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Neon)
- Netlify — hosting and continuous deployment (useful for quick previews and production). (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Netlify)
- Zapier — automate notifications and workflows (e.g., new task -> Slack/email). (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Zapier)
- Figma — design-to-code conversion and sync. Use Builder.io Figma plugin: https://www.figma.com/community/plugin/747985167520967365/builder-io-ai-powered-figma-to-code-react-vue-tailwind-more (Get Plugin in MCP Servers)
- Supabase — alternative DB + auth real-time backend (useful if you prefer Supabase). (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Supabase)
- Builder CMS — manage Builder content programmatically and view models. (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Builder CMS)
- Linear — sync tasks or issues with product tickets. (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Linear)
- Notion — docs and knowledge base (sync export/import). (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Notion)
- Sentry — error monitoring and performance tracing for runtime issues. (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Sentry)
- Context7 — up-to-date docs for any library/framework used. (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Context7)
- Semgrep — security static analysis for the codebase. (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Semgrep)
- Prisma Postgres — ORM + Postgres management (useful with Prisma schema and migrations). (Connect via [Open MCP popover](#open-mcp-popover) -> Connect to Prisma Postgres)

Notes & next steps
- Some workflows require you to provide environment variables after connecting (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, and any API keys). Use the DevServerControl tool or the Builder UI "Set env vars" flow to set these securely.
- If you plan to use Neon/Supabase/Prisma Postgres, create the database and save the connection string to DATABASE_URL.
- After connecting Builder.io, import or map content models to the pages in `temp/task management/src` if you want CMS-driven content.

If you want, I can prepare a small README with exact env var names and example values to paste into the Builder "Set env vars" UI.
