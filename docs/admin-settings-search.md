# Settings Search — UX, Copy, and Validation

Overview
- Purpose: Provide fast, accessible client-side fuzzy search across Settings categories and tabs.
- Components:
  - useSettingsSearchIndex (hook): builds Fuse index from SETTINGS_REGISTRY
  - SettingsSearch (UI): input, results list, keyboard handling (/, Mod+K, Arrow navigation, Enter)

UX Copy and Microcopy
- Placeholder: "Search settings (Cmd/Ctrl+K)"
- Input aria-label: `Search settings`
- Empty state copy: "No results for \"{query}\". Try different keywords or browse categories."
- Hint text under the input (small, muted): "Use arrow keys to navigate. Press Enter to open." 

Accessibility
- Input must have aria-label="Search settings" and role="search"
- Results list should use role="listbox" and each result role="option" with aria-selected state
- Announce results count via aria-live="polite" when results change
- Keyboard
  - `/` focuses input unless an editable element is active
  - Mod+K focuses input
  - ArrowDown/ArrowUp move selection
  - Enter navigates to selected item
  - Escape clears input and closes results

Performance & UX
- Build Fuse index on client from SETTINGS_REGISTRY; keep in memo and update only when registry changes
- Debounce input (150ms) before running fuse.search
- Show skeleton loading only for very large indexes; prefer instant results for small registries

Empty & Error states
- Empty query: show recent/frequent items (from sessionStorage) or helpful quick links
- No results: show help text and top categories
- On error (search engine failure): fall back to alphabetical results and log the error for Sentry

Telemetry & Metrics
- Track search usage events (search.open, search.query, search.select) with minimal PII
- For high-volume tenants, consider server-side search (see backend doc)

Testing & Validation
- Unit tests: ensure keyboard flows, focus, and aria attributes
- DOM tests: simulate / and Mod+K, arrow navigation, enter
- E2E: check that selecting a result navigates to the correct route and that recent items persist in session

MCP Integrations (recommended)
- Supabase: Use for server-side, tenant-scoped search index and auth (preferred for DB-backed search). Connect: [Connect to Supabase](#open-mcp-popover)
- Neon: Alternative Postgres provider—suitable for serverless Postgres workloads. Connect: [Connect to Neon](#open-mcp-popover)
- Netlify: For deployment/hosting of preview environments. Connect: [Connect to Netlify](#open-mcp-popover)
- Zapier: For automations around admin actions (optional). Connect: [Connect to Zapier](#open-mcp-popover)
- Figma: Use Builder.io Figma plugin for design conversions. Get plugin via MCP Servers UI or the plugin link in docs.
- Builder CMS: Manage content or dynamic text for settings help pages. Connect: [Connect to Builder.io](#open-mcp-popover)
- Linear: Track tasks and issues related to search improvements. Connect: [Connect to Linear](#open-mcp-popover)
- Notion: Documentation and product copy management. Connect: [Connect to Notion](#open-mcp-popover)
- Sentry: Capture errors and regressions in search UX. Connect: [Connect to Sentry](#open-mcp-popover)
- Context7: Use for up-to-date library docs when implementing components. Connect: [Open MCP popover](#open-mcp-popover)
- Semgrep: Static analysis for security-sensitive code in search indexing. Connect: [Open MCP popover](#open-mcp-popover)
- Prisma Postgres: If implementing server-side index storage, prefer Prisma + Postgres. Connect: [Open MCP popover](#open-mcp-popover)

Notes:
- To connect any MCP, open the MCP popover in the Builder UI: [Open MCP popover](#open-mcp-popover). Supabase is recommended for DB-backed search.

---

File: docs/admin-settings-search.md


