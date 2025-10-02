# Organization Settings – Full Audit

Scope: All tenant-level organization settings (schema, APIs, services, components, and usage). Build errors fixed in Organization tabs (Branding, Contact, Localization) and ClientLayout.

## Summary of Findings
- Actively used: general.name, branding.logoUrl, localization.defaultLocale
- Not wired/unused: general.tagline, general.description, general.industry, contact.*, localization.defaultTimezone, localization.defaultCurrency, branding.legalLinks (not consumed), branding.branding (placeholder)
- Security/RBAC: Correct on API routes (view/edit/export/import). Import is rate-limited. UI respects permissions.
- Multi-tenancy: API routes correctly filter by tenant. Root app/layout.tsx fetches organizationSettings without tenant scoping → potential cross-tenant leakage of name/logo/locale.
- UX: Legal links duplicated in BrandingTab and LegalTab; contact and legal settings not surfaced in site chrome (footer).

---

## Inventory & Classification
Name | Schema Path | Scope | Storage | API | UI Surface | Impact | Status
---|---|---|---|---|---|---|---
Organization Name | OrganizationSettings.general.name | Tenant | DB: organization_settings.name | GET/PUT/Export/Import | Nav header (Navigation) | Frontend rendering (branding in header) | Used
Tagline | OrganizationSettings.general.tagline | Tenant | DB: organization_settings.tagline | GET/PUT/Export/Import | Admin page only | None | Unused
Description | OrganizationSettings.general.description | Tenant | DB: organization_settings.description | GET/PUT/Export/Import | Admin page only | None | Unused
Industry | OrganizationSettings.general.industry | Tenant | DB: organization_settings.industry | GET/PUT/Export/Import | Admin page only | None | Unused
Contact Email | OrganizationSettings.contact.contactEmail | Tenant | DB: organization_settings.contactEmail | GET/PUT/Export/Import | Admin page only | None | Unused
Contact Phone | OrganizationSettings.contact.contactPhone | Tenant | DB: organization_settings.contactPhone | GET/PUT/Export/Import | Admin page only | None | Unused
Contact Address | OrganizationSettings.contact.address | Tenant | DB: organization_settings.address (JSON) | GET/PUT/Export/Import | Admin page only | None | Unused
Default Timezone | OrganizationSettings.localization.defaultTimezone | Tenant | DB: organization_settings.defaultTimezone | GET/PUT/Export/Import | Admin page only | None | Unused
Default Currency | OrganizationSettings.localization.defaultCurrency | Tenant | DB: organization_settings.defaultCurrency | GET/PUT/Export/Import | Admin page only | None | Unused (separate Services settings manage currency)
Default Locale | OrganizationSettings.localization.defaultLocale | Tenant | DB: organization_settings.defaultLocale | GET/PUT/Export/Import | Site-wide via TranslationProvider | Frontend localization bootstrapping | Used
Logo URL | OrganizationSettings.branding.logoUrl | Tenant | DB: organization_settings.logoUrl | GET/PUT/Export/Import | Nav header (Navigation) | Frontend branding (logo) | Used
Branding (JSON) | OrganizationSettings.branding.branding | Tenant | DB: organization_settings.branding (JSON) | GET/PUT/Export/Import | Admin page only | None | Unused/placeholder
Legal Links (terms/privacy/refund) | OrganizationSettings.branding.legalLinks | Tenant | DB: organization_settings.legalLinks (JSON) | GET/PUT/Export/Import | Admin Legal/Branding tabs | None (footer uses static routes) | Unused
MULTI_TENANCY_ENABLED | env | System | Env var | n/a | Affects tenantFilter behavior | Security/scoping | Used (system-level)

Notes:
- “Legal Links” currently stored under branding. Consider its own schema group or move UI-only to LegalTab consistently.

---

## Impact Verification (Usage Traces)
- general.name → src/app/layout.tsx reads (Prisma) → passed to ClientLayout → src/components/ui/navigation.tsx displays as orgName
- branding.logoUrl → src/app/layout.tsx reads (Prisma) → ClientLayout → Navigation shows logo
- localization.defaultLocale → src/app/layout.tsx reads → passed to TranslationProvider as initialLocale (affects i18n)
- contact.*, tagline, description, industry, defaultTimezone, defaultCurrency, branding.branding, branding.legalLinks → referenced in Admin UI only; not referenced in runtime components, middleware, hooks, or third-party integrations

Backend logic, API responses, third-party integrations:
- No service logic, pricing, or scheduling behavior conditioned on org settings (timezone/currency/contact/industry not used). Export/Import available but data is inert outside UI.

---

## Schema & Persistence Check
- Validation: src/schemas/settings/organization.ts (Zod)
  - OrgGeneralSchema, OrgContactSchema, OrgLocalizationSchema (with defaults), OrgBrandingSchema
  - legalLinks typed as z.record(z.string(), z.string())
- Persistence: prisma OrganizationSettings model with typed columns and JSON fields (address, branding, legalLinks)
- Defaults: Enforced in API PUT/Import handlers (fallbacks to existing or hard defaults for locale/currency/timezone). Zod defaults apply when the specific nested object is present.

Gaps:
- legalLinks schema is a generic record while UI expects { terms, privacy, refund }; type mismatch causes maintenance issues (recent TS error fixed in UI by normalizing).

---

## Security & Multi-Tenancy
- API routes: /api/admin/org-settings{, /export, /import}
  - RBAC enforced via PERMISSIONS.ORG_SETTINGS_*; import has rate limit
  - tenant scoping via getTenantFromRequest + tenantFilter
- Risk: src/app/layout.tsx uses prisma.organizationSettings.findFirst(...) without tenantFilter. If MULTI_TENANCY_ENABLED=true, this can leak one tenant’s name/logo/locale to others.

Recommendation: In app/layout.tsx, derive tenant from request host and query with tenantFilter (or dedicated server util) to avoid cross-tenant leakage.

---

## UI/UX Validation
- Organization Settings presented on dedicated page (good for tenant-wide scope)
- Duplicated legal links UI in both BrandingTab and LegalTab; keep only in LegalTab
- Contact settings and Legal Links not reflected in site chrome (footer remains hardcoded). Expectation: org-level legal/contact should populate footer links and contact details

---

## Optimization & Cleanup
1) Remove or repurpose unused fields
- Unused: tagline, description, industry, contact.*, defaultTimezone, defaultCurrency, branding.branding, branding.legalLinks (until wired)
- Either wire them into UI (footer, meta tags) or deprecate

2) Consistency & schema-driven settings
- Change legalLinks to explicit schema: z.object({ terms: z.string().url().optional(), privacy: z.string().url().optional(), refund: z.string().url().optional() })
- Add a typed Branding schema for theme tokens if needed (document keys)

3) Multi-tenancy hardening
- Apply tenantFilter in app/layout.tsx; consider caching per-tenant settings in memory/edge cache

4) Wiring to UI
- Footer (OptimizedFooter and components/ui/footer.tsx):
  - Use orgName and logo initials; generate legal links from organization settings when present; fall back to static routes
  - Show contact email/phone/address if available

5) Defaults
- Ensure defaults centralized (schema-level) and avoid divergent API fallbacks; consider a service util like getEffectiveOrgSettings(tenantId)

---

## Concrete Recommendations
- Short term
  - Fix tenant scoping in app/layout.tsx
  - Consolidate Legal Links UI into LegalTab; remove from BrandingTab
  - Wire footer to Organization Settings (orgName, logoUrl initials, legalLinks, contact)
  - Align schema for legalLinks to explicit object; run a safe migration to map existing JSON

- Medium term
  - Decide on Branding.branding JSON contract or drop until needed
  - If timezone/currency intended to influence pricing/scheduling, add usage in relevant services (pricing.ts, calendar) with clear precedence (org vs service vs user)
  - Add tests for API permissions, import/export, and UI reflection of settings

---

## File Map (key references)
- Schema: src/schemas/settings/organization.ts
- API: src/app/api/admin/org-settings/route.ts, import/route.ts, export/route.ts
- Prisma: prisma/schema.prisma → model OrganizationSettings
- UI (Admin): src/app/admin/settings/company/page.tsx and tabs under src/components/admin/settings/groups/Organization/
- UI (Public): src/app/layout.tsx, src/components/ui/navigation.tsx, src/components/ui/optimized-footer.tsx (static)
- Security: src/lib/permissions.ts, src/lib/tenant.ts

---

## Status Matrix (Used vs Unused)
- Used: general.name, branding.logoUrl, localization.defaultLocale
- Unused/Placeholder: general.tagline, general.description, general.industry, contact.*, localization.defaultTimezone, localization.defaultCurrency, branding.legalLinks, branding.branding

---

## Risk Register
- Cross-tenant data exposure risk in app/layout.tsx (no tenant scoping) → HIGH priority fix when MULTI_TENANCY_ENABLED=true
- Schema/UI mismatch for legalLinks → MEDIUM; addressed in UI but should be enforced at schema-level

---

## Suggested Tasks (Implementation Plan)
- Apply tenant scoping in app/layout.tsx using getTenantFromRequest(headers()) and tenantFilter
- Update footer components to read org settings via server loader or context; hydrate from app/layout props
- Remove duplicate legal fields from BrandingTab; keep LegalTab authoritative
- Adjust schema to explicit legalLinks object; add migration script to map record→object keys
- Add tests:
  - Permissions coverage for GET/PUT/Export/Import
  - Multi-tenant isolation test (different hostnames → different settings)
  - Footer reflects settings when present
