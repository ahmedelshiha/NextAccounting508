# Admin Settings Panel — Comprehensive Enhancement Plan

Purpose
- Deliver a professional, centralized Settings experience that controls the entire application. 
- Unify navigation, schemas, RBAC, and APIs across 12 categories, reusing existing Booking Settings patterns (service layer, zod validation, audit logging, tenant scoping, caching).

Scope
- Enhance Admin Sidebar to a first-class Settings hub.
- Implement a typed settings registry and shell UI with tabs per category.
- Add/extend APIs and services per category with consistent RBAC and audit.
- Expand Booking Settings with Automation, Integrations, Capacity, and Forms.

Key Principles
- Single source of truth: typed settings registry powering UI + navigation.
- Security: getServerSession + per-route hasPermission; tenant scoping via getTenantFromRequest.
- UX: accessible tabs, keyboard friendly, responsive; status badges and validation feedback.
- Performance: cache reads, invalidate on writes; use granular endpoints for heavy sections.

---

Architecture Overview
1) Registry-driven Settings
- Define categories, tabs, permissions, API endpoints, and zod schemas in one place.
- Render UI from registry; AdminSidebar consumes the same registry for links and RBAC.

2) API & Services Pattern
- Next.js Route Handlers under src/app/api/admin/**.
- Per-category service encapsulates validation, persistence, caching, and audit logging.
- Zod on input boundaries; strong types between UI and API.

3) RBAC & Tenancy
- Every route calls getServerSession(authOptions) and validates hasPermission(role, PERMISSIONS.*).
- Extract tenant via getTenantFromRequest and apply tenantFilter where needed.

---

Proposed File Structure (incremental)
- src/lib/settings/
  - registry.ts
  - types.ts
- src/components/admin/settings/
  - SettingsShell.tsx
  - Tabs.tsx
  - FormField.tsx
  - groups/
    - Organization/
      - GeneralTab.tsx
      - ContactTab.tsx
      - LocalizationTab.tsx
      - BrandingTab.tsx
      - LegalTab.tsx
    - ServiceManagement/
      - GeneralTab.tsx
      - CategoriesTab.tsx
      - SchedulingTab.tsx
      - PricingTab.tsx
      - VersionsTab.tsx
      - AnalyticsTab.tsx
    - Booking/
      - BookingSettingsPanel.tsx (extend existing)
      - AutomationTab.tsx
      - IntegrationsTab.tsx
      - CapacityTab.tsx
      - FormsTab.tsx
    - ClientManagement/
      - RegistrationTab.tsx
      - ProfilesTab.tsx
      - CommunicationTab.tsx
      - SegmentationTab.tsx
      - LoyaltyTab.tsx
      - PortalTab.tsx
    - TaskWorkflow/
      - GeneralTab.tsx
      - TemplatesTab.tsx
      - StatusesTab.tsx
      - AutomationTab.tsx
      - BoardViewsTab.tsx
      - DependenciesTab.tsx
    - TeamManagement/
      - StructureTab.tsx
      - AvailabilityTab.tsx
      - SkillsTab.tsx
      - WorkloadTab.tsx
      - PermissionsTab.tsx
      - PerformanceTab.tsx
    - Financial/
      - InvoicingTab.tsx
      - PaymentsTab.tsx
      - ExpensesTab.tsx
      - TaxesTab.tsx
      - CurrenciesTab.tsx
      - ReportsTab.tsx
      - ReconciliationTab.tsx
    - AnalyticsReporting/
      - DashboardsTab.tsx
      - MetricsTab.tsx
      - ExportsTab.tsx
      - DataRetentionTab.tsx
      - IntegrationsTab.tsx
      - PrivacyTab.tsx
    - Communication/
      - EmailTab.tsx
      - SMSTab.tsx
      - ChatTab.tsx
      - NotificationsTab.tsx
      - NewslettersTab.tsx
      - RemindersTab.tsx
    - SecurityCompliance/
      - AuthenticationTab.tsx
      - SessionsTab.tsx
      - ApiAccessTab.tsx
      - AuditTab.tsx
      - PrivacyTab.tsx
      - ComplianceTab.tsx
      - UploadsTab.tsx
    - IntegrationHub/
      - PaymentsTab.tsx
      - CalendarsTab.tsx
      - CommunicationTab.tsx
      - AnalyticsTab.tsx
      - StorageTab.tsx
      - WebhooksTab.tsx
      - ApiKeysTab.tsx
    - SystemAdministration/
      - EnvironmentTab.tsx
      - PerformanceTab.tsx
      - CronJobsTab.tsx
      - HealthChecksTab.tsx
      - BackupsTab.tsx
      - LogsTab.tsx
      - RedisTab.tsx
- src/app/admin/settings/
  - page.tsx (hub shell)
  - [category]/page.tsx (routes per category; reuse SettingsShell)
- src/app/api/admin/
  - org-settings/route.ts
  - service-settings/route.ts
  - client-settings/route.ts
  - task-settings/route.ts
  - team-settings/route.ts
  - financial-settings/route.ts
  - analytics-settings/route.ts
  - communication-settings/route.ts
  - security-settings/route.ts
  - integration-hub/route.ts
  - system-settings/route.ts
  - booking-settings/* (already present; extend for new tabs if needed)
- src/schemas/settings/
  - organization.ts
  - service-management.ts
  - client-management.ts
  - task-workflow.ts
  - team-management.ts
  - financial.ts
  - analytics-reporting.ts
  - communication.ts
  - security-compliance.ts
  - integration-hub.ts
  - system-admin.ts

Note: Booking settings schemas live at src/schemas/booking-settings.schemas.ts and remain the booking authority; new booking tabs get their own zod slices there.

---

Settings Types & Registry
```ts
// src/lib/settings/types.ts
import type { z } from 'zod'
import { PERMISSIONS, type Permission } from '@/lib/permissions'

export type SettingsCategoryKey =
  | 'organization' | 'serviceManagement' | 'booking' | 'clientManagement'
  | 'taskWorkflow' | 'teamManagement' | 'financial' | 'analyticsReporting'
  | 'communication' | 'securityCompliance' | 'integrationHub' | 'systemAdministration'

export interface SettingsTab<Schema> {
  key: string
  label: string
  description?: string
  permission: Permission
  get: (tenantId?: string) => Promise<Schema>
  put: (payload: Schema, tenantId?: string) => Promise<Schema>
}

export interface SettingsCategory {
  key: SettingsCategoryKey
  label: string
  route: string
  icon: (props: { className?: string }) => JSX.Element
  tabs: SettingsTab<any>[]
}
```

```ts
// src/lib/settings/registry.ts
import { Building2, Cog, Users, ClipboardList, ShieldCheck, CreditCard, LineChart, MessageSquare, Lock, PlugZap, ServerCog } from 'lucide-react'
import type { SettingsCategory } from './types'
import { PERMISSIONS } from '@/lib/permissions'

export const SETTINGS_REGISTRY: SettingsCategory[] = [
  {
    key: 'organization',
    label: 'Organization Settings',
    route: '/admin/settings/company',
    icon: Building2,
    tabs: [] // UI pulls concrete tabs defined in per-category modules; populated on import
  },
  {
    key: 'serviceManagement',
    label: 'Service Management',
    route: '/admin/settings/services',
    icon: ClipboardList,
    tabs: []
  },
  {
    key: 'booking',
    label: 'Booking Configuration',
    route: '/admin/settings/booking',
    icon: Cog,
    tabs: []
  },
  {
    key: 'clientManagement',
    label: 'Client Management',
    route: '/admin/settings/clients',
    icon: Users,
    tabs: []
  },
  {
    key: 'taskWorkflow',
    label: 'Task & Workflow',
    route: '/admin/settings/tasks',
    icon: ClipboardList,
    tabs: []
  },
  {
    key: 'teamManagement',
    label: 'Team Management',
    route: '/admin/settings/team',
    icon: Users,
    tabs: []
  },
  {
    key: 'financial',
    label: 'Financial Settings',
    route: '/admin/settings/financial',
    icon: CreditCard,
    tabs: []
  },
  {
    key: 'analyticsReporting',
    label: 'Analytics & Reporting',
    route: '/admin/settings/analytics',
    icon: LineChart,
    tabs: []
  },
  {
    key: 'communication',
    label: 'Communication',
    route: '/admin/settings/communication',
    icon: MessageSquare,
    tabs: []
  },
  {
    key: 'securityCompliance',
    label: 'Security & Compliance',
    route: '/admin/settings/security',
    icon: ShieldCheck,
    tabs: []
  },
  {
    key: 'integrationHub',
    label: 'Integration Hub',
    route: '/admin/settings/integrations',
    icon: PlugZap,
    tabs: []
  },
  {
    key: 'systemAdministration',
    label: 'System Administration',
    route: '/admin/settings/system',
    icon: ServerCog,
    tabs: []
  }
]
```

Admin Sidebar Integration
- Replace hardcoded children with a derived list from SETTINGS_REGISTRY, filtering tabs/pages visible based on hasPermission.

```tsx
// Example: adding Settings groups in src/components/admin/layout/AdminSidebar.tsx
import { SETTINGS_REGISTRY } from '@/lib/settings/registry'
import { hasPermission } from '@/lib/permissions'

function SettingsGroup({ role }: { role?: string }) {
  const items = SETTINGS_REGISTRY
    .map(c => ({ label: c.label, href: c.route }))
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 px-3 py-2">Settings</div>
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.href}><a href={item.href} className="text-gray-600 hover:text-gray-800">{item.label}</a></li>
        ))}
      </ul>
    </div>
  )
}
```

Settings Shell UI
```tsx
// src/components/admin/settings/SettingsShell.tsx
'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SETTINGS_REGISTRY } from '@/lib/settings/registry'

export default function SettingsShell({ title, description, tabs }: { title: string; description?: string; tabs: { key: string; label: string }[] }) {
  const pathname = usePathname()
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <aside className="lg:col-span-1">
        <nav className="bg-white border rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
          <ul className="space-y-1">
            {tabs.map(t => (
              <li key={t.key}>
                <Link href={`${pathname}?tab=${t.key}`} className="flex items-center justify-between px-2 py-2 rounded hover:bg-gray-50 text-gray-700">
                  <span>{t.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <section className="lg:col-span-4">
        <div className="bg-white border rounded-lg p-6">
          {description && <p className="text-gray-600 mb-4">{description}</p>}
          <div id="settings-content" />
        </div>
      </section>
    </div>
  )
}
```

Form Field Component
```tsx
// src/components/admin/settings/FormField.tsx
'use client'
import React from 'react'

export function TextField({ label, value, onChange, placeholder }:{ label:string; value:string; onChange:(v:string)=>void; placeholder?:string }){
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
    </div>
  )
}
```

Organization Settings — General Tab (UI + API)
```tsx
// src/components/admin/settings/groups/Organization/GeneralTab.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { TextField } from '@/components/admin/settings/FormField'

export default function OrgGeneralTab(){
  const [pending, setPending] = useState({ name: '', tagline: '', description: '', industry: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => {
    const r = await fetch('/api/admin/org-settings')
    const j = await r.json()
    setPending({ name: j.name || '', tagline: j.tagline || '', description: j.description || '', industry: j.industry || '' })
  })() }, [])

  async function save(){
    setSaving(true)
    const r = await fetch('/api/admin/org-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) })
    if (!r.ok) console.error('Failed to save organization settings')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <TextField label="Company Name" value={pending.name} onChange={(v)=>setPending(p=>({ ...p, name:v }))} />
      <TextField label="Tagline" value={pending.tagline} onChange={(v)=>setPending(p=>({ ...p, tagline:v }))} />
      <TextField label="Description" value={pending.description} onChange={(v)=>setPending(p=>({ ...p, description:v }))} />
      <TextField label="Industry" value={pending.industry} onChange={(v)=>setPending(p=>({ ...p, industry:v }))} />
      <button onClick={save} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50" disabled={saving}>Save Changes</button>
    </div>
  )
}
```

```ts
// src/schemas/settings/organization.ts
import { z } from 'zod'
export const OrgGeneralSchema = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(200).optional().default(''),
  description: z.string().max(2000).optional().default(''),
  industry: z.string().max(120).optional().default('')
})
export type OrgGeneral = z.infer<typeof OrgGeneralSchema>
```

```ts
// src/app/api/admin/org-settings/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'
import { OrgGeneralSchema } from '@/schemas/settings/organization'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const row = await prisma.organizationSettings.findFirst({ where: tenantFilter(tenantId) }).catch(() => null)
  return NextResponse.json(row || { name: '', tagline: '', description: '', industry: '' })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(() => ({}))
  const parsed = OrgGeneralSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  const existing = await prisma.organizationSettings.findFirst({ where: tenantFilter(tenantId) }).catch(() => null)
  const data = { ...parsed.data, tenantId: tenantId || undefined }
  const saved = existing
    ? await prisma.organizationSettings.update({ where: { id: existing.id }, data })
    : await prisma.organizationSettings.create({ data })
  try { await logAudit({ action: 'org-settings:update', actorId: session.user.id, details: { tenantId } }) } catch {}
  return NextResponse.json(saved)
}
```

Note: Map permissions to your policy (e.g., ORG_SETTINGS_VIEW/EDIT). The example uses ANALYTICS_VIEW for illustration; replace with dedicated keys if present.

---

Booking Configuration — Enhanced Tabs
- Extend existing src/components/admin/BookingSettingsPanel.tsx with four new tabs and fields:
  - Automation: auto-confirm rules, follow-up sequences, cancellation policies.
  - Integrations: calendar sync preference, conferencing link provider.
  - Capacity: resource pooling, concurrent booking limits, waitlists.
  - Forms: custom intake fields, conditional logic, validation rules.

UI Extension
```tsx
// Within src/components/admin/BookingSettingsPanel.tsx
// Add to local tabs array
const TABS = [
  { key: 'general', label: 'General' },
  { key: 'payments', label: 'Payments' },
  { key: 'steps', label: 'Booking Steps' },
  { key: 'availability', label: 'Availability' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'customers', label: 'Customer Experience' },
  { key: 'assignments', label: 'Team Assignments' },
  { key: 'pricing', label: 'Dynamic Pricing' },
  { key: 'automation', label: 'Automation' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'forms', label: 'Forms' }
]
```

API Additions (booking)
- POST /api/admin/booking-settings/validate (already present) can validate new sections if included in request body.
- If splitting endpoints, add:
  - PUT /api/admin/booking-settings/automation
  - PUT /api/admin/booking-settings/integrations
  - PUT /api/admin/booking-settings/capacity
  - PUT /api/admin/booking-settings/forms

Zod Schemas
```ts
// src/schemas/booking-settings.schemas.ts (add slices)
import { z } from 'zod'
export const BookingAutomationSchema = z.object({
  autoConfirm: z.boolean().default(false),
  confirmIf: z.enum(['always','known-client','paid']).default('known-client'),
  followUps: z.array(z.object({ hoursAfter: z.number().min(1).max(8760), templateId: z.string() })).max(20).default([]),
  cancellationPolicy: z.object({ hoursBefore: z.number().min(0).max(720), feePercent: z.number().min(0).max(100) }).default({ hoursBefore: 24, feePercent: 0 })
})
export const BookingIntegrationsSchema = z.object({
  calendarSync: z.enum(['none','google','outlook','ical']).default('none'),
  conferencing: z.enum(['none','zoom','meet']).default('none')
})
export const BookingCapacitySchema = z.object({
  pooledResources: z.boolean().default(false),
  concurrentLimit: z.number().min(1).max(100).default(5),
  waitlist: z.boolean().default(false)
})
export const BookingFormsSchema = z.object({
  fields: z.array(z.object({ key: z.string().min(1), label: z.string().min(1), type: z.enum(['text','select','number','date']), required: z.boolean().default(false), options: z.array(z.string()).optional() })).max(100).default([]),
  rules: z.array(z.object({ ifField: z.string(), equals: z.string().optional(), thenRequire: z.array(z.string()).default([]) })).max(100).default([])
})
```

Route Handler Example
```ts
// src/app/api/admin/booking-settings/automation/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import service from '@/services/booking-settings.service'
import { BookingAutomationSchema } from '@/schemas/booking-settings.schemas'
import { logAudit } from '@/lib/audit'

export async function PUT(req: Request){
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.BOOKING_SETTINGS_EDIT)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const body = await req.json().catch(()=>({}))
  const parsed = BookingAutomationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  const updated = await service.updateBookingSettings(tenantId, { automation: parsed.data } as any)
  try { await logAudit({ action: 'booking-settings:automation:update', actorId: session.user.id, details: { tenantId } }) } catch {}
  return NextResponse.json({ automation: updated.automation })
}
```

Service Update Hook (booking)
- Extend service.validateSettingsUpdate to include new sections (automation, integrations, capacity, forms) and ensure cache invalidation remains intact.

---

Security & Compliance Settings — Example
```ts
// src/app/api/admin/security-settings/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

const SecuritySchema = z.object({
  passwordPolicy: z.object({ minLength: z.number().min(8).max(128), requireSymbols: z.boolean().default(true), requireNumbers: z.boolean().default(true) }).default({ minLength: 12, requireSymbols: true, requireNumbers: true }),
  mfa: z.object({ enforced: z.boolean().default(false) }).default({ enforced: false }),
  sso: z.object({ enabled: z.boolean().default(false), provider: z.enum(['none','saml','oauth']).default('none') }).default({ enabled: false, provider: 'none' })
})

export async function GET(req: Request){
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.USERS_MANAGE)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = getTenantFromRequest(req as any)
  const row = await prisma.securitySettings.findFirst({ where: tenantFilter(tenantId) }).catch(()=>null)
  return NextResponse.json(row || { passwordPolicy: { minLength: 12, requireSymbols: true, requireNumbers: true }, mfa: { enforced: false }, sso: { enabled: false, provider: 'none' } })
}

export async function PUT(req: Request){
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.USERS_MANAGE)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = getTenantFromRequest(req as any)
  const data = await req.json().catch(()=>({}))
  const parsed = SecuritySchema.safeParse(data)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
  const existing = await prisma.securitySettings.findFirst({ where: tenantFilter(tenantId) }).catch(()=>null)
  const saved = existing
    ? await prisma.securitySettings.update({ where: { id: existing.id }, data: { ...parsed.data, tenantId: tenantId || undefined } })
    : await prisma.securitySettings.create({ data: { ...parsed.data, tenantId: tenantId || undefined } })
  try { await logAudit({ action: 'security-settings:update', actorId: session.user.id, details: { tenantId } }) } catch {}
  return NextResponse.json(saved)
}
```

Integration Hub — MCP Suggestions
- Use Builder.io MCP integrations to manage external services.
- Available servers: Neon, Netlify, Zapier, Figma (plugin), Supabase, Builder CMS, Linear, Notion, Sentry, Context7, Semgrep, Prisma Postgres.
- Benefits:
  - Neon: Postgres provisioning and management for settings persistence and analytics; click [Open MCP popover](#open-mcp-popover) to connect.
  - Netlify: Hosting and deploy previews; configure environment for feature flags and settings APIs.
  - Zapier: Automate settings change notifications or sync templates.
  - Figma: Import branded email/template designs for Branding/Email tabs.
  - Supabase: Alternative auth/realtime for communication and client portals.
  - Builder CMS: Manage legal pages, email templates, and brand assets.
  - Linear/Notion: Document and track configuration changes and runbooks.
  - Sentry: Error monitoring thresholds and alerting configured under Analytics/Integrations tabs.
  - Context7: Bring in live docs for libraries used by settings UI.
  - Semgrep: Scan settings services for security issues pre-deploy.
  - Prisma Postgres: ORM-layer operations and schema evolution.

Connect via [Open MCP popover](#open-mcp-popover) and select the relevant servers.

---

Rollout Plan
1) Registry foundation: add src/lib/settings/{types,registry}.ts; wire AdminSidebar to display Settings categories from registry.
2) Organization Settings pages: implement General/Contact/Localization/Branding/Legal tabs with UI + API + schema + service (if centralizing service).
3) Booking tabs: extend BookingSettingsPanel with Automation/Integrations/Capacity/Forms; add schemas and optional sub-endpoints.
4) Financial/Communication/Security: implement per-category GET/PUT routes with zod schemas; add audit logging.
5) Integrations/MCP: add configuration tabs and test buttons (test email, test Stripe) with masked key inputs and status badges.
6) Analytics/Reporting: dashboards default layouts, KPI definitions, export scheduling.
7) System Administration: health checks, cron schedules, feature flags; read-only when lacking permissions.
8) QA: run tests (service/API/UI), verify RBAC, confirm caching and warnings display.

QA Checklist
- All admin API routes require auth and correct permissions.
- Tenant scoping applied; no cross-tenant data leakage.
- PUT validates payloads and returns clear 400s; warnings surfaced in UI.
- Booking import/export/reset fully functional; new tabs save and load correctly.
- Sidebar and Settings hub remain accessible, responsive, and consistent.

Appendix — Minimal Page Wrapper Example
```tsx
// src/app/admin/settings/company/page.tsx
import SettingsShell from '@/components/admin/settings/SettingsShell'
import dynamic from 'next/dynamic'

const OrgGeneralTab = dynamic(() => import('@/components/admin/settings/groups/Organization/GeneralTab'))

export default function Page() {
  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'contact', label: 'Contact' },
    { key: 'localization', label: 'Localization' },
    { key: 'branding', label: 'Branding' },
    { key: 'legal', label: 'Legal' }
  ]
  return (
    <SettingsShell title="Organization Settings" description="Core business identity and operational parameters" tabs={tabs} />
  )
}
```

Notes
- Follow existing styling conventions; keep rounded corners and blue accents unchanged.
- Use shorthand CSS and preserve variable syntax where present.
- Convert any inline styles to CSS classes in new components.
- Maintain existing breakpoints and responsive behavior.
