# Admin Sidebar Audit & Settings Panel Enhancement

Paths
- Sidebar: src/components/admin/layout/AdminSidebar.tsx
- Layouts: src/components/admin/layout/{ClientOnlyAdminLayout.tsx, AdminDashboardLayout.tsx}
- Header/Tenant: src/components/admin/layout/{AdminHeader.tsx, TenantSwitcher.tsx}
- Legacy nav config (duplicated concept): src/components/dashboard/nav.config.ts ⚠️

Summary
- Role: Primary navigation for all admin capabilities, with sections (dashboard, business, financial, operations, system), nested items, badges, RBAC checks. Responsive with mobile overlay, collapsible children. Uses counts from /api/admin/stats/counts.

Findings
- Structure & Links
  - Sections: dashboard, business, financial, operations, system; children per item.
  - Dead/missing routes ⚠️: /admin/services/categories, /admin/services/analytics, /admin/invoices/templates, /admin/uploads (root). Backed pages do not exist in src/app/admin.
  - Missing but available pages: /admin/newsletter, /admin/notifications, settings/{company,contact,timezon e,financial}. Add to sidebar.
  - Previews/* are not linked (good) and should remain hidden in production.
- RBAC
  - Mixed coverage: some items specify permission (e.g., SERVICES_VIEW), others do not.
  - Recommend permissions:
    - Financial (Invoices, Payments, Expenses, Taxes, Reports): PERMISSIONS.ANALYTICS_VIEW
    - Tasks: TASKS_READ_ALL or TASKS_READ_ASSIGNED (derive visibility by role)
    - Reminders: ANALYTICS_VIEW or a dedicated REMINDERS_VIEW if added
    - Chat: restrict to staff (TEAM_VIEW) if needed
- State & Behavior
  - Collapsible handling uses last path segment as key; initial expandedSections includes ['dashboard','business'] but only item-level collapses exist (not section-level). Consider explicit ids per group/item.
  - Expanded state not persisted; add localStorage to remember collapses and favorites.
  - Active detection uses startsWith, OK for hierarchical match.
- Counts/Badges
  - Counts are wired to /api/admin/stats/counts with sample values. Extend to include invoices overdue, quarantine items, unread chat, etc. Ensure SSE revalidation covers needed events.
- Accessibility
  - Good: aria-current, aria-expanded/controls, role="group" labels.
  - Gaps: When collapsed, text is hidden; add aria-label on <Link>/<button> or render a visually-hidden label to ensure screen readers announce item names.
  - Keyboard: Provide roving tabindex and ArrowLeft/Right to expand/collapse submenus. Ensure focus visible styles.
  - Mobile overlay focus trap and ESC to close (currently click-out only from AdminSidebar).
- Responsiveness
  - ClientOnlyAdminLayout mounts mobile sidebar only when open (OK) and relies on AdminSidebar’s own backdrop.
  - AdminDashboardLayout (not in use) also renders a separate backdrop while AdminSidebar renders one too → potential double overlay if adopted later ⚠���. Unify backdrop ownership when switching layouts.
- Duplication Risk ⚠️
  - nav.config.ts defines a separate nav grouping with overlapping labels and permissions. Divergence likely over time. Centralize to a single admin nav registry.

Recommendations (Implementation Plan)
1) Centralize Nav Registry
- Create src/components/admin/layout/admin-nav.ts exporting a typed registry consumed by AdminSidebar and (optionally) AdminHeader breadcrumbs.
- Remove or deprecate src/components/dashboard/nav.config.ts for admin. Keep a separate site-level nav if needed.

Proposed types
```ts
// src/components/admin/layout/admin-nav.ts
import type { Permission } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { type ComponentType } from 'react'

export type NavId =
  | 'overview' | 'analytics' | 'reports'
  | 'bookings' | 'calendar' | 'availability' | 'booking-new'
  | 'clients' | 'client-profiles' | 'client-invitations' | 'client-new'
  | 'services' | 'service-requests'
  | 'invoices' | 'invoice-sequences'
  | 'payments' | 'expenses' | 'taxes'
  | 'tasks' | 'team' | 'chat' | 'reminders'
  | 'settings' | 'settings-company' | 'settings-contact' | 'settings-timezone' | 'settings-financial' | 'settings-currencies' | 'settings-booking'
  | 'users' | 'roles' | 'permissions'
  | 'security' | 'audits' | 'compliance' | 'uploads-quarantine'
  | 'cron-telemetry' | 'integrations' | 'newsletter' | 'notifications'

export interface AdminNavItem {
  id: NavId
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  permission?: Permission
  featureFlag?: string
  children?: AdminNavItem[]
  getBadge?: (ctx: { tenantId?: string; role?: string }) => Promise<string | number | undefined>
}

export interface AdminNavSection { label: string; id: string; items: AdminNavItem[] }
export const adminNav: AdminNavSection[] = [ /* fill with items from audit, ensuring only real routes */ ]
```

2) Clean Up Links and Add Missing Ones
- Remove dead routes: services/categories, services/analytics, invoices/templates, uploads root.
- Add: newsletter, notifications, settings subpages (company, contact, timezone, financial).
- Consider a Content section (Posts, Newsletter) if content management is part of admin.

3) RBAC Hardening
- Annotate all items with permission. Suggested mapping:
  - Dashboard: Overview (none), Analytics/Reports (ANALYTICS_VIEW)
  - Business: Bookings (TEAM_VIEW), Calendar (TEAM_VIEW), Availability (TEAM_VIEW), New Booking (TEAM_VIEW), Clients (USERS_VIEW), Services (SERVICES_VIEW), Service Requests (SERVICE_REQUESTS_READ_ALL)
  - Financial: Invoices/Payments/Expenses/Taxes/Reports (ANALYTICS_VIEW)
  - Operations: Tasks (TASKS_READ_ALL or show when TASKS_READ_ASSIGNED), Team (TEAM_VIEW), Chat (TEAM_VIEW), Reminders (ANALYTICS_VIEW)
  - System: Settings (BOOKING_SETTINGS_VIEW), Booking Settings (BOOKING_SETTINGS_VIEW), Currencies (ANALYTICS_VIEW), Users (USERS_VIEW), Roles (USERS_MANAGE), Permissions (USERS_MANAGE), Security/Audits/Compliance (ANALYTICS_VIEW), Uploads (ANALYTICS_VIEW), Cron Telemetry (ANALYTICS_VIEW), Integrations (ANALYTICS_VIEW)

4) UX Enhancements for a Comprehensive Settings Panel
- Create a first-class Settings mega-section with categories and pages:
  - Organization: General, Company, Contact, Timezone, Financial, Currencies
  - Booking: Steps, Business Hours, Payment Methods, Import/Export/Reset
  - Integrations: Payments (Stripe), Email, Analytics (Sentry), Realtime/Cache
  - Security: Users, Roles, Permissions, Audit, Compliance, Session policy
  - System: Env diagnostics, Health, Cron telemetry
- Add status badges: e.g., “Action required” when env/config missing, or “Degraded” when health checks fail.
- Provide quick actions: “Export settings”, “Reset to defaults” (existing APIs), “Test email”, “Test Stripe”.

5) Personalization & Productivity
- Favorites/Pinning: let users pin items to a “Quick Access” group (persisted in localStorage per user).
- Search within sidebar: filter items by label/alias; keyboard focus jump.
- Recently visited: show last N routes for quick return.

6) Accessibility and Mobile
- Collapsed mode: add aria-labels or visually-hidden labels on items; optional tooltip on hover/focus.
- Keyboard: implement arrow key navigation and Enter/Space toggle for submenus.
- Mobile: move backdrop ownership to layout, trap focus in the sidebar, close on ESC.

7) Performance
- Memoize built nav via useMemo and derive badges asynchronously via getBadge; throttle badge refresh to avoid chattiness.
- Tree-shake icons by importing only those used.

8) Delivery Checklist
- Implement admin-nav.ts and refactor AdminSidebar to consume it.
- Remove dead links; add missing settings items and content section.
- Apply permission mapping and add hasPermission checks consistently.
- Persist expanded/collapsed state and favorites to localStorage.
- Add a11y improvements (labels, keyboard, focus trap).
- QA mobile open/close (ensure single backdrop) across ClientOnlyAdminLayout and (future) AdminDashboardLayout.
- Update docs and screenshots.

Known Gaps To Address
- Global search in AdminHeader is not implemented.
- Some counts are sample values; replace with DB-backed counts in production.
- Duplicate nav sources (AdminSidebar vs nav.config.ts). Unify to eliminate drift.
