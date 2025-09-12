# Comprehensive Settings Panel - Project Directory Structure

## Extended Directory Structure

```
accounting-firm/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── settings/                          # New Settings Module
│   │   │   │   ├── page.tsx                      # Settings Dashboard
│   │   │   │   ├── loading.tsx                   # Loading UI
│   │   │   │   ├── error.tsx                     # Error Boundary
│   │   │   │   ├── layout.tsx                    # Settings Layout
│   │   │   │   │
│   │   │   │   ├── general/                      # General Settings
│   │   │   │   │   ├── page.tsx                  # Company info, branding
│   │   │   │   │   └── components/
│   │   │   │   │       ├── company-info-form.tsx
│   │   │   │   │       ├── branding-settings.tsx
│   │   │   │   │       └── site-configuration.tsx
│   │   │   │   │
│   │   │   │   ├── regional/                     # Regional Configuration
│   │   │   │   │   ├── page.tsx                  # Country selection & overview
│   │   │   │   │   ├── [country]/                # Dynamic country routes
│   │   │   │   │   │   ├── page.tsx              # Country dashboard
│   │   │   │   │   │   ├── business/page.tsx     # Business settings
│   │   │   │   │   │   ├── legal/page.tsx        # Legal & compliance
│   │   │   │   │   │   ├── localization/page.tsx # Language & format
│   │   │   │   │   │   └── contact/page.tsx      # Office info
│   │   │   │   │   └── components/
│   │   │   │   │       ├── country-selector.tsx
│   │   │   │   │       ├── regional-overview.tsx
│   │   │   │   │       ├── business-hours-form.tsx
│   │   │   │   │       ├── vat-settings-form.tsx
│   │   │   │   │       ├── office-info-form.tsx
│   │   │   │   │       └── compliance-checker.tsx
│   │   │   │   │
│   │   │   │   ├── permissions/                  # Advanced RBAC
│   │   │   │   │   ├── page.tsx                  # Permissions overview
│   │   │   │   │   ├── roles/
│   │   │   │   │   │   ├── page.tsx              # Role management
│   │   │   │   │   │   ├── [roleId]/page.tsx     # Edit role
│   │   │   │   │   │   └── new/page.tsx          # Create role
│   │   │   │   │   ├── users/
│   │   │   │   │   │   ├── page.tsx              # User permissions
│   │   │   │   │   │   └── [userId]/page.tsx     # Edit user permissions
│   │   │   │   │   └── components/
│   │   │   │   │       ├── role-builder.tsx
│   │   │   │   │       ├── permission-matrix.tsx
│   │   │   │   │       ├── bulk-user-manager.tsx
│   │   │   │   │       ├── role-templates.tsx
│   │   │   │   │       └── permission-preview.tsx
│   │   │   │   │
│   │   │   │   ├── financial/                    # Currency & Financial
│   │   │   │   │   ├── page.tsx                  # Financial overview
│   │   │   │   │   ├── currencies/
│   │   │   │   │   │   ├── page.tsx              # Currency management
│   │   │   │   │   │   ├── rates/page.tsx        # Exchange rates
│   │   │   │   │   │   └── overrides/page.tsx    # Price overrides
│   │   │   │   │   ├── payments/
│   │   │   │   │   │   ├── page.tsx              # Payment gateways
│   │   │   │   │   │   └── [gateway]/page.tsx    # Gateway settings
│   │   │   │   │   ├── pricing/
│   │   │   │   │   │   ├── page.tsx              # Pricing strategy
│   │   │   │   │   │   └── regional/page.tsx     # Regional pricing
│   │   │   │   │   └── components/
│   │   │   │   │       ├── currency-manager.tsx
│   │   │   │   │       ├── exchange-rate-monitor.tsx
│   │   │   │   │       ├── pricing-calculator.tsx
│   │   │   │   │       ├── payment-gateway-config.tsx
│   │   │   │   │       └── financial-reports.tsx
│   │   │   │   │
│   │   │   │   ├── analytics/                    # BI Configuration
│   │   │   │   │   ├── page.tsx                  # Analytics dashboard config
│   │   │   │   │   ├── dashboards/
│   │   │   │   │   │   ├── page.tsx              # Dashboard builder
│   │   │   │   │   │   └── [dashboardId]/page.tsx
│   │   │   │   │   ├── reports/
│   │   │   │   │   │   ├── page.tsx              # Report templates
│   │   │   │   │   │   └── builder/page.tsx      # Custom report builder
│   │   │   │   │   ├── kpis/page.tsx             # KPI configuration
│   │   │   │   │   └── components/
│   │   │   │   │       ├── dashboard-builder.tsx
│   │   │   │   │       ├── widget-library.tsx
│   │   │   │   │       ├── kpi-configurator.tsx
│   │   │   │   │       ├── report-scheduler.tsx
│   │   │   │   │       └── analytics-preview.tsx
│   │   │   │   │
│   │   │   │   ├── communications/               # Communication Hub
│   │   │   │   │   ├── page.tsx                  # Communication overview
│   │   │   │   │   ├── email/
│   │   │   │   │   │   ├── page.tsx              # Email settings
│   │   │   │   │   │   ├── templates/page.tsx    # Email templates
│   │   │   │   │   │   └── providers/page.tsx    # Email providers
│   │   │   │   │   ├── sms/page.tsx              # SMS configuration
│   │   │   │   │   ├── whatsapp/page.tsx         # WhatsApp Business
│   │   │   │   │   ├── notifications/
│   │   │   │   │   │   ├── page.tsx              # Notification settings
│   │   │   │   │   │   └── channels/page.tsx     # Notification channels
│   │   │   │   │   └── components/
│   │   │   │   │       ├── email-template-editor.tsx
│   │   │   │   │       ├── sms-provider-config.tsx
│   │   │   │   │       ├── whatsapp-integration.tsx
│   │   │   │   │       ├── notification-builder.tsx
│   │   │   │   │       └── message-preview.tsx
│   │   │   │   │
│   │   │   │   ├── integrations/                 # Third-party Integrations
│   │   │   │   │   ├── page.tsx                  # Integration hub
│   │   │   │   │   ├── government/
│   │   │   │   │   │   ├── page.tsx              # Government APIs
│   │   │   │   │   │   ├── uae/page.tsx          # UAE MOHRE
│   │   │   │   │   │   ├── ksa/page.tsx          # KSA ZATCA
│   │   │   │   │   │   └── egypt/page.tsx        # Egypt Tax Authority
│   │   │   │   │   ├── banking/page.tsx          # Banking integrations
│   │   │   │   │   ├── webhooks/
│   │   │   │   │   │   ├── page.tsx              # Webhook management
│   │   │   │   │   │   └── [webhookId]/page.tsx  # Edit webhook
│   │   │   │   │   ├── apis/page.tsx             # API management
│   │   │   │   │   └── components/
│   │   │   │   │       ├── integration-card.tsx
│   │   │   │   │       ├── webhook-builder.tsx
│   │   │   │   │       ├── api-key-manager.tsx
│   │   │   │   │       ├── integration-status.tsx
│   │   │   │   │       └── connection-tester.tsx
│   │   │   │   │
│   │   │   │   ├── security/                     # Security & Compliance
│   │   │   │   │   ├── page.tsx                  # Security overview
│   │   │   │   │   ├── compliance/
│   │   │   │   │   │   ├── page.tsx              # Compliance dashboard
│   │   │   │   │   │   ├── gdpr/page.tsx         # GDPR settings
│   │   │   │   │   │   ├── regional/page.tsx     # Regional compliance
│   │   │   │   │   │   └── audit/page.tsx        # Audit settings
│   │   │   │   │   ├── access/
│   │   │   │   │   │   ├── page.tsx              # Access control
│   │   │   │   │   │   ├── sessions/page.tsx     # Session management
│   │   │   │   │   │   └── policies/page.tsx     # Security policies
│   │   │   │   │   ├── monitoring/page.tsx       # Security monitoring
│   │   │   │   │   └── components/
│   │   │   │   │       ├── compliance-checker.tsx
│   │   │   │   │       ├── security-monitor.tsx
│   │   │   │   │       ├── access-log-viewer.tsx
│   │   │   │   │       ├── policy-builder.tsx
│   │   │   │   │       └── threat-detector.tsx
│   │   │   │   │
│   │   │   │   ├── system/                       # System Administration
│   │   │   │   │   ├── page.tsx                  # System overview
│   │   │   │   │   ├── performance/
│   │   │   │   │   │   ├── page.tsx              # Performance settings
│   │   │   │   │   │   ├── caching/page.tsx      # Cache configuration
│   │   │   │   │   │   └── optimization/page.tsx # Optimization settings
│   │   │   │   │   ├── maintenance/
│   │   │   │   │   │   ├── page.tsx              # Maintenance schedules
│   │   │   │   │   │   ├── backups/page.tsx      # Backup configuration
│   │   │   │   │   │   └── updates/page.tsx      # System updates
│   │   │   │   │   ├── monitoring/
│   │   │   │   │   │   ├── page.tsx              # System monitoring
│   │   │   │   │   │   ├── alerts/page.tsx       # Alert configuration
│   │   │   │   │   │   └── logs/page.tsx         # Log management
│   │   │   │   │   └── components/
│   │   │   │   │       ├── performance-monitor.tsx
│   │   │   │   │       ├── cache-manager.tsx
│   │   │   │   │       ├── backup-scheduler.tsx
│   │   │   │   │       ├── alert-configurator.tsx
│   │   │   │   │       └── log-analyzer.tsx
│   │   │   │   │
│   │   │   │   └── components/                   # Shared Settings Components
│   │   │   │       ├── settings-layout.tsx      # Main settings layout
│   │   │   │       ├── settings-navigation.tsx  # Side navigation
│   │   │   │       ├── settings-breadcrumb.tsx  # Breadcrumb navigation
│   │   │   │       ├── settings-header.tsx      # Page headers
│   │   │   │       ├── form-section.tsx         # Form sections
│   │   │   │       ├── save-indicator.tsx       # Auto-save indicator
│   │   │   │       ├── changes-tracker.tsx      # Track unsaved changes
│   │   │   │       ├── confirmation-dialog.tsx  # Confirmation dialogs
│   │   │   │       └── help-tooltip.tsx         # Context help
│   │   │   │
│   │   │   └── [existing admin pages...]
│   │   │
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── settings/                     # Settings API Endpoints
│   │   │   │   │   ├── route.ts                  # Main settings CRUD
│   │   │   │   │   │
│   │   │   │   │   ├── general/
│   │   │   │   │   │   ├── route.ts              # General settings
│   │   │   │   │   │   ├── company/route.ts      # Company info
│   │   │   │   │   │   └── branding/route.ts     # Branding settings
│   │   │   │   │   │
│   │   │   │   │   ├── regional/
│   │   │   │   │   │   ├── route.ts              # Regional settings list
│   │   │   │   │   │   ├── [country]/
│   │   │   │   │   │   │   ├── route.ts          # Country settings
│   │   │   │   │   │   │   ├── business/route.ts # Business settings
│   │   │   │   │   │   │   ├── legal/route.ts    # Legal settings
│   │   │   │   │   │   │   └── contact/route.ts  # Contact settings
│   │   │   │   │   │   └── bulk/route.ts         # Bulk operations
│   │   │   │   │   │
│   │   │   │   │   ├── permissions/
│   │   │   │   │   │   ├── route.ts              # Permission management
│   │   │   │   │   │   ├── roles/
│   │   │   │   │   │   │   ├── route.ts          # Role CRUD
│   │   │   │   │   │   │   └── [roleId]/route.ts # Individual role
│   │   │   │   │   │   ├── users/
│   │   │   │   │   │   │   ├── route.ts          # User permissions
│   │   │   │   │   │   │   └── [userId]/route.ts # Individual user
│   │   │   │   │   │   ├── templates/route.ts    # Role templates
│   │   │   │   │   │   └── bulk/route.ts         # Bulk permission updates
│   │   │   │   │   │
│   │   │   │   │   ├── financial/
│   │   │   │   │   │   ├── route.ts              # Financial settings
│   │   │   │   │   │   ├── currencies/
│   │   │   │   │   │   │   ├── route.ts          # Currency management
│   │   │   │   │   │   │   ├── rates/route.ts    # Exchange rates
│   │   │   │   │   │   │   └── refresh/route.ts  # Rate refresh
│   │   │   │   │   │   ├── payments/
│   │   │   │   │   │   │   ├── route.ts          # Payment gateways
│   │   │   │   │   │   │   └── [gateway]/route.ts
│   │   │   │   │   │   └── pricing/
│   │   │   │   │   │       ├── route.ts          # Pricing settings
│   │   │   │   │   │       └── calculate/route.ts
│   │   │   │   │   │
│   │   │   │   │   ├── analytics/
│   │   │   │   │   │   ├── route.ts              # Analytics config
│   │   │   │   │   │   ├── dashboards/
│   │   │   │   │   │   │   ├── route.ts          # Dashboard management
│   │   │   │   │   │   │   └── [dashboardId]/route.ts
│   │   │   │   │   │   ├── reports/
│   │   │   │   │   │   │   ├── route.ts          # Report templates
│   │   │   │   │   │   │   └── generate/route.ts
│   │   │   │   │   │   └── kpis/route.ts         # KPI configuration
│   │   │   │   │   │
│   │   │   │   │   ├── communications/
│   │   │   │   │   │   ├── route.ts              # Communication settings
│   │   │   │   │   │   ├── email/
│   │   │   │   │   │   │   ├── route.ts          # Email settings
│   │   │   │   │   │   │   ├── templates/route.ts
│   │   │   │   │   │   │   ├── test/route.ts     # Test email
│   │   │   │   │   │   │   └── providers/route.ts
│   │   │   │   │   │   ├── sms/route.ts          # SMS settings
│   │   │   │   │   │   ├── whatsapp/route.ts     # WhatsApp config
│   │   │   │   │   │   └── notifications/route.ts
│   │   │   │   │   │
│   │   │   │   │   ├── integrations/
│   │   │   │   │   │   ├── route.ts              # Integration hub
│   │   │   │   │   │   ├── government/
│   │   │   │   │   │   │   ├── route.ts          # Government APIs
│   │   │   │   │   │   │   ├── uae/route.ts      # UAE integrations
│   │   │   │   │   │   │   ├── ksa/route.ts      # KSA integrations
│   │   │   │   │   │   │   └── egypt/route.ts    # Egypt integrations
│   │   │   │   │   │   ├── banking/route.ts      # Banking APIs
│   │   │   │   │   │   ├── webhooks/
│   │   │   │   │   │   │   ├── route.ts          # Webhook CRUD
│   │   │   │   │   │   │   └── [webhookId]/route.ts
│   │   │   │   │   │   └── test/route.ts         # Integration testing
│   │   │   │   │   │
│   │   │   │   │   ├── security/
│   │   │   │   │   │   ├── route.ts              # Security settings
│   │   │   │   │   │   ├── compliance/
│   │   │   │   │   │   │   ├── route.ts          # Compliance settings
│   │   │   │   │   │   │   ├── gdpr/route.ts     # GDPR settings
│   │   │   │   │   │   │   └── audit/route.ts    # Audit configuration
│   │   │   │   │   │   ├── access/
│   │   │   │   │   │   │   ├── route.ts          # Access control
│   │   │   │   │   │   │   ├── sessions/route.ts # Session management
│   │   │   │   │   │   │   └── policies/route.ts # Security policies
│   │   │   │   │   │   └── monitoring/route.ts   # Security monitoring
│   │   │   │   │   │
│   │   │   │   │   └── system/
│   │   │   │   │       ├── route.ts              # System settings
│   │   │   │   │       ├── performance/
│   │   │   │   │       │   ├── route.ts          # Performance settings
│   │   │   │   │       │   ├── cache/route.ts    # Cache management
│   │   │   │   │       │   └── optimize/route.ts # Optimization
│   │   │   │   │       ├── maintenance/
│   │   │   │   │       │   ├── route.ts          # Maintenance settings
│   │   │   │   │       │   ├── backup/route.ts   # Backup management
│   │   │   │   │       │   └── update/route.ts   # System updates
│   │   │   │   │       └── monitoring/
│   │   │   │   │           ├── route.ts          # System monitoring
│   │   │   │   │           ├── alerts/route.ts   # Alert management
│   │   │   │   │           └── logs/route.ts     # Log management
│   │   │   │   │
│   │   │   │   └── [existing admin APIs...]
│   │   │   │
│   │   │   └── [existing API routes...]
│   │   │
│   │   └── [existing app structure...]
│   │
│   ├── lib/
│   │   ├── settings/                             # Settings Core Logic
│   │   │   ├── index.ts                          # Main settings manager
│   │   │   ├── types.ts                          # TypeScript definitions
│   │   │   ├── schema.ts                         # Zod validation schemas
│   │   │   ├── defaults.ts                       # Default configurations
│   │   │   ├── regional/
│   │   │   │   ├── index.ts                      # Regional settings manager
│   │   │   │   ├── countries.ts                  # Country configurations
│   │   │   │   ├── currencies.ts                 # Regional currencies
│   │   │   │   ├── compliance.ts                 # Regional compliance
│   │   │   │   └── validation.ts                 # Regional validation
│   │   │   ├── permissions/
│   │   │   │   ├── index.ts                      # Permission system
│   │   │   │   ├── roles.ts                      # Role management
│   │   │   │   ├── matrix.ts                     # Permission matrix
│   │   │   │   ├── templates.ts                  # Role templates
│   │   │   │   └── inheritance.ts                # Permission inheritance
│   │   │   ├── financial/
│   │   │   │   ├── index.ts                      # Financial settings
│   │   │   │   ├── currency-manager.ts           # Currency management
│   │   │   │   ├── exchange-rates.ts             # Exchange rate logic
│   │   │   │   ├── pricing-engine.ts             # Pricing calculations
│   │   │   │   └── payment-gateways.ts           # Payment integration
│   │   │   ├── analytics/
│   │   │   │   ├── index.ts                      # Analytics configuration
│   │   │   │   ├── dashboard-builder.ts          # Dashboard logic
│   │   │   │   ├── report-generator.ts           # Report generation
│   │   │   │   ├── kpi-calculator.ts             # KPI calculations
│   │   │   │   └── data-aggregator.ts            # Data aggregation
│   │   │   ├── communications/
│   │   │   │   ├── index.ts                      # Communication manager
│   │   │   │   ├── email-manager.ts              # Email management
│   │   │   │   ├── sms-manager.ts                # SMS management
│   │   │   │   ├── whatsapp-manager.ts           # WhatsApp integration
│   │   │   │   ├── template-engine.ts            # Template processing
│   │   │   │   └── notification-dispatcher.ts    # Notification routing
│   │   │   ├── integrations/
│   │   │   │   ├── index.ts                      # Integration manager
│   │   │   │   ├── government-apis.ts            # Government integrations
│   │   │   │   ├── banking-apis.ts               # Banking integrations
│   │   │   │   ├── webhook-manager.ts            # Webhook management
│   │   │   │   └── api-client.ts                 # API client utilities
│   │   │   ├── security/
│   │   │   │   ├── index.ts                      # Security manager
│   │   │   │   ├── compliance-checker.ts         # Compliance validation
│   │   │   │   ├── access-control.ts             # Access control logic
│   │   │   │   ├── audit-logger.ts               # Enhanced audit logging
│   │   │   │   ├── threat-detector.ts            # Threat detection
│   │   │   │   └── policy-enforcer.ts            # Policy enforcement
│   │   │   └── system/
│   │   │       ├── index.ts                      # System manager
│   │   │       ├── performance-monitor.ts        # Performance monitoring
│   │   │       ├── cache-manager.ts              # Cache management
│   │   │       ├── backup-scheduler.ts           # Backup scheduling
│   │   │       ├── update-manager.ts             # Update management
│   │   │       └── health-checker.ts             # Health monitoring
│   │   │
│   │   ├── hooks/                                # Custom React Hooks
│   │   │   ├── use-settings.ts                   # Settings hook
│   │   │   ├── use-regional-settings.ts          # Regional settings hook
│   │   │   ├── use-permissions.ts                # Permissions hook
│   │   │   ├── use-currency.ts                   # Currency hook
│   │   │   ├── use-analytics-config.ts           # Analytics config hook
│   │   │   ├── use-integrations.ts               # Integrations hook
│   │   │   ├── use-security-config.ts            # Security config hook
│   │   │   ├── use-auto-save.ts                  # Auto-save functionality
│   │   │   ├── use-changes-tracker.ts            # Track unsaved changes
│   │   │   └── use-form-validation.ts            # Form validation hook
│   │   │
│   │   └── [existing lib files...]
│   │
│   ├── components/
│   │   ├── settings/                             # Settings UI Components
│   │   │   ├── common/                           # Common Settings Components
│   │   │   │   ├── settings-card.tsx            # Settings card wrapper
│   │   │   │   ├── settings-form.tsx            # Form wrapper
│   │   │   │   ├── settings-field.tsx           # Form field wrapper
│   │   │   │   ├── settings-section.tsx         # Section wrapper
│   │   │   │   ├── settings-toggle.tsx          # Toggle component
│   │   │   │   ├── settings-select.tsx          # Select component
│   │   │   │   ├── settings-input.tsx           # Input component
│   │   │   │   ├── settings-textarea.tsx        # Textarea component
│   │   │   │   ├── color-picker.tsx             # Color picker
│   │   │   │   ├── file-uploader.tsx            # File upload
│   │   │   │   ├── json-editor.tsx              # JSON editor
│   │   │   │   └── code-editor.tsx              # Code editor
│   │   │   │
│   │   │   ├── navigation/                      # Settings Navigation
│   │   │   │   ├── settings-sidebar.tsx         # Main sidebar
│   │   │   │   ├── settings-tabs.tsx            # Tab navigation
│   │   │   │   ├── breadcrumb.tsx               # Breadcrumb navigation
│   │   │   │   └── quick-actions.tsx            # Quick action buttons
│   │   │   │
│   │   │   ├── regional/                        # Regional Components
│   │   │   │   ├── country-selector.tsx         # Country selection
│   │   │   │   ├── regional-dashboard.tsx       # Regional overview
│   │   │   │   ├── business-hours-config.tsx    # Business hours
│   │   │   │   ├── vat-configuration.tsx        # VAT settings
│   │   │   │   ├── office-locations.tsx         # Office management
│   │   │   │   ├── compliance-status.tsx        # Compliance checker
│   │   │   │   └── localization-settings.tsx    # Localization
│   │   │   │
│   │   │   ├── permissions/                     # Permission Components
│   │   │   │   ├── role-builder.tsx             # Visual role builder
│   │   │   │   ├── permission-matrix.tsx        # Permission grid
│   │   │   │   ├── user-role-manager.tsx        # User role assignment
│   │   │   │   ├── bulk-permissions.tsx         # Bulk operations
│   │   │   │   ├── role-templates.tsx           # Pre-defined roles
│   │   │   │   ├── permission-preview.tsx       # Permission preview
│   │   │   │   └── inheritance-tree.tsx         # Permission inheritance
│   │   │   │
│   │   │   ├── financial/                       # Financial Components
│   │   │   │   ├── currency-dashboard.tsx       # Currency overview
│   │   │   │   ├── exchange-rate-monitor.tsx    # Rate monitoring
│   │   │   │   ├── pricing-calculator.tsx       # Price calculator
│   │   │   │   ├── payment-gateway-config.tsx   # Gateway setup
│   │   │   │   ├── regional-pricing.tsx         # Regional pricing
│   │   │   │   ├── margin-calculator.tsx        # Margin calculator
│   │   │   │   └── financial-reports.tsx     # Financial reporting
│   │   │   │
│   │   │   ├── analytics/                       # Analytics Components
│   │   │   │   ├── dashboard-builder.tsx        # Visual dashboard builder
│   │   │   │   ├── widget-library.tsx           # Widget components
│   │   │   │   ├── kpi-configurator.tsx         # KPI setup
│   │   │   │   ├── chart-builder.tsx            # Chart configuration
│   │   │   │   ├── report-scheduler.tsx         # Report scheduling
│   │   │   │   ├── data-source-manager.tsx      # Data source config
│   │   │   │   ├── filter-builder.tsx           # Filter configuration
│   │   │   │   └── analytics-preview.tsx        # Live preview
│   │   │   │
│   │   │   ├── communications/                  # Communication Components
│   │   │   │   ├── email-template-editor.tsx    # Visual email editor
│   │   │   │   ├── template-library.tsx         # Template gallery
│   │   │   │   ├── sms-configurator.tsx         # SMS setup
│   │   │   │   ├── whatsapp-integration.tsx     # WhatsApp config
│   │   │   │   ├── notification-builder.tsx     # Notification setup
│   │   │   │   ├── channel-manager.tsx          # Channel management
│   │   │   │   ├── message-preview.tsx          # Message preview
│   │   │   │   └── delivery-tracking.tsx        # Delivery status
│   │   │   │
│   │   │   ├── integrations/                    # Integration Components
│   │   │   │   ├── integration-hub.tsx          # Integration overview
│   │   │   │   ├── api-connection-tester.tsx    # Connection testing
│   │   │   │   ├── webhook-builder.tsx          # Webhook configuration
│   │   │   │   ├── government-api-config.tsx    # Gov API setup
│   │   │   │   ├── banking-integration.tsx      # Banking setup
│   │   │   │   ├── integration-status.tsx       # Status monitoring
│   │   │   │   ├── api-key-manager.tsx          # API key management
│   │   │   │   └── sync-monitor.tsx             # Data sync monitoring
│   │   │   │
│   │   │   ├── security/                        # Security Components
│   │   │   │   ├── compliance-dashboard.tsx     # Compliance overview
│   │   │   │   ├── security-monitor.tsx         # Security monitoring
│   │   │   │   ├── access-log-viewer.tsx        # Access logs
│   │   │   │   ├── threat-detector.tsx          # Threat detection
│   │   │   │   ├── policy-builder.tsx           # Policy configuration
│   │   │   │   ├── audit-trail.tsx              # Audit trail viewer
│   │   │   │   ├── session-manager.tsx          # Session management
│   │   │   │   └── vulnerability-scanner.tsx     # Security scanning
│   │   │   │
│   │   │   └── system/                          # System Components
│   │   │       ├── performance-dashboard.tsx    # Performance overview
│   │   │       ├── cache-monitor.tsx            # Cache monitoring
│   │   │       ├── backup-scheduler.tsx         # Backup management
│   │   │       ├── update-manager.tsx           # System updates
│   │   │       ├── log-analyzer.tsx             # Log analysis
│   │   │       ├── alert-configurator.tsx       # Alert setup
│   │   │       ├── health-monitor.tsx           # System health
│   │   │       └── maintenance-scheduler.tsx    # Maintenance planning
│   │   │
│   │   └── [existing components...]
│   │
│   ├── types/
│   │   ├── settings/                            # Settings Type Definitions
│   │   │   ├── index.ts                         # Main settings types
│   │   │   ├── regional.ts                      # Regional settings types
│   │   │   ├── permissions.ts                   # Permission types
│   │   │   ├── financial.ts                     # Financial types
│   │   │   ├── analytics.ts                     # Analytics types
│   │   │   ├── communications.ts                # Communication types
│   │   │   ├── integrations.ts                  # Integration types
│   │   │   ├── security.ts                      # Security types
│   │   │   └── system.ts                        # System types
│   │   │
│   │   └── [existing types...]
│   │
│   ├── middleware/                              # Enhanced Middleware
│   │   ├── settings-auth.ts                     # Settings authentication
│   │   ├── regional-access.ts                   # Regional access control
│   │   ├── permission-check.ts                  # Permission validation
│   │   └── audit-logger.ts                      # Audit logging middleware
│   │
│   └── [existing src structure...]
│
├── prisma/
│   ├── schema.prisma                            # Extended Database Schema
│   ├── migrations/                              # Database Migrations
│   │   ├── [timestamp]_add_settings_tables.sql
│   │   ├── [timestamp]_add_regional_config.sql
│   │   ├── [timestamp]_add_advanced_permissions.sql
│   │   ├── [timestamp]_add_financial_settings.sql
│   │   ├── [timestamp]_add_analytics_config.sql
│   │   ├── [timestamp]_add_communication_settings.sql
│   │   ├── [timestamp]_add_integration_config.sql
│   │   ├── [timestamp]_add_security_settings.sql
│   │   └── [timestamp]_add_system_settings.sql
│   ├── seeds/                                   # Database Seeds
│   │   ├── settings-seed.ts                     # Default settings
│   │   ├── regional-seed.ts                     # Regional configurations
│   │   ├── permissions-seed.ts                  # Default permissions
│   │   └── templates-seed.ts                    # Template configurations
│   └── [existing prisma files...]
│
├── public/
│   ├── images/
│   │   ├── settings/                            # Settings UI Images
│   │   │   ├── flags/                           # Country flags
│   │   │   │   ├── uae.svg
│   │   │   │   ├── ksa.svg
│   │   │   │   └── egypt.svg
│   │   │   ├── integrations/                    # Integration logos
│   │   │   │   ├── sendgrid.svg
│   │   │   │   ├── whatsapp.svg
│   │   │   │   └── banks/
│   │   │   │       ├── emirates-nbd.svg
│   │   │   │       ├── rajhi.svg
│   │   │   │       └── nbe.svg
│   │   │   └── illustrations/                   # UI illustrations
│   │   │       ├── settings-hero.svg
│   │   │       ├── regional-config.svg
│   │   │       └── dashboard-builder.svg
│   │   └── [existing images...]
│   └── [existing public files...]
│
├── docs/
│   ├── settings/                                # Settings Documentation
│   │   ├── README.md                            # Settings overview
│   │   ├── installation.md                      # Setup guide
│   │   ├── regional-configuration.md            # Regional setup
│   │   ├── permissions-guide.md                 # Permission management
│   │   ├── financial-settings.md                # Financial configuration
│   │   ├── analytics-setup.md                   # Analytics configuration
│   │   ├── communications-guide.md              # Communication setup
│   │   ├── integrations-manual.md               # Integration guide
│   │   ├── security-compliance.md               # Security & compliance
│   │   ├── system-administration.md             # System admin guide
│   │   ├── troubleshooting.md                   # Troubleshooting guide
│   │   └── api-reference.md                     # API documentation
│   └── [existing docs...]
│
├── tests/
│   ├── settings/                                # Settings Tests
│   │   ├── unit/                                # Unit tests
│   │   │   ├── lib/                             # Library tests
│   │   │   │   ├── settings-manager.test.ts
│   │   │   │   ├── regional-config.test.ts
│   │   │   │   ├── permission-system.test.ts
│   │   │   │   ├── currency-manager.test.ts
│   │   │   │   └── analytics-config.test.ts
│   │   │   ├── components/                      # Component tests
│   │   │   │   ├── settings-form.test.tsx
│   │   │   │   ├── role-builder.test.tsx
│   │   │   │   ├── currency-dashboard.test.tsx
│   │   │   │   └── dashboard-builder.test.tsx
│   │   │   └── hooks/                           # Hook tests
│   │   │       ├── use-settings.test.ts
│   │   │       ├── use-permissions.test.ts
│   │   │       └── use-currency.test.ts
│   │   ├── integration/                         # Integration tests
│   │   │   ├── api/                             # API tests
│   │   │   │   ├── settings-endpoints.test.ts
│   │   │   │   ├── regional-api.test.ts
│   │   │   │   ├── permissions-api.test.ts
│   │   │   │   └── financial-api.test.ts
│   │   │   ├── pages/                           # Page tests
│   │   │   │   ├── settings-pages.test.tsx
│   │   │   │   ├── regional-pages.test.tsx
│   │   │   │   └── admin-settings.test.tsx
│   │   │   └── workflows/                       # Workflow tests
│   │   │       ├── settings-workflow.test.ts
│   │   │       ├── permission-workflow.test.ts
│   │   │       └── currency-workflow.test.ts
│   │   └── e2e/                                 # End-to-end tests
│   │       ├── settings-navigation.spec.ts
│   │       ├── regional-configuration.spec.ts
│   │       ├── permission-management.spec.ts
│   │       ├── currency-management.spec.ts
│   │       └── system-settings.spec.ts
│   └── [existing tests...]
│
├── config/
│   ├── settings/                                # Settings Configuration
│   │   ├── defaults.json                        # Default settings
│   │   ├── regional/                            # Regional configs
│   │   │   ├── uae.json                         # UAE configuration
│   │   │   ├── ksa.json                         # KSA configuration
│   │   │   └── egypt.json                       # Egypt configuration
│   │   ├── permissions/                         # Permission templates
│   │   │   ├── admin.json                       # Admin role template
│   │   │   ├── manager.json                     # Manager role template
│   │   │   ├── staff.json                       # Staff role template
│   │   │   └── client.json                      # Client role template
│   │   ├── integrations/                        # Integration configs
│   │   │   ├── government-apis.json             # Government API configs
│   │   │   ├── banking-apis.json                # Banking API configs
│   │   │   └── communication-providers.json     # Communication providers
│   │   └── compliance/                          # Compliance configs
│   │       ├── gdpr.json                        # GDPR settings
│   │       ├── uae-data-protection.json         # UAE data laws
│   │       ├── ksa-data-protection.json         # KSA data laws
│   │       └── egypt-data-protection.json       # Egypt data laws
│   └── [existing config files...]
│
├── scripts/
│   ├── settings/                                # Settings Scripts
│   │   ├── migrate-settings.ts                  # Settings migration
│   │   ├── seed-regional-data.ts                # Regional data seeding
│   │   ├── backup-settings.ts                   # Settings backup
│   │   ├── validate-config.ts                   # Configuration validation
│   │   └── import-export-settings.ts            # Settings import/export
│   └── [existing scripts...]
│
└── [existing root files...]
```

## New Database Models

### Core Settings Tables

```sql
-- Settings management
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  country_code VARCHAR(3), -- For regional settings
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category, key, country_code)
);

-- Regional configurations
CREATE TABLE regional_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  base_currency VARCHAR(3) NOT NULL,
  supported_currencies TEXT[] NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  business_hours JSONB NOT NULL,
  vat_settings JSONB,
  compliance_config JSONB,
  contact_info JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Advanced permissions
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL,
  is_system_role BOOLEAN DEFAULT FALSE,
  country_access TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User role assignments
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Integration configurations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, sms, payment, government, banking
  provider VARCHAR(100) NOT NULL,
  country_code VARCHAR(3),
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhook configurations
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  headers JSONB,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics configurations
CREATE TABLE analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  shared_with TEXT[], -- user IDs or role names
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- System monitoring
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(20),
  country_code VARCHAR(3),
  recorded_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Communication templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, sms, whatsapp
  subject VARCHAR(255),
  content TEXT NOT NULL,
  variables TEXT[],
  country_code VARCHAR(3),
  language VARCHAR(5),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Key Features Summary

### 1. **Multi-Regional Management**
- Country-specific settings for UAE, KSA, Egypt
- Regional business hours, currencies, compliance
- Localized contact information and legal documents

### 2. **Advanced Permission System**
- Visual role builder with drag-and-drop
- Granular permissions matrix
- Regional access control
- Time-based permissions and role expiry

### 3. **Financial Management**
- Multi-currency support with real-time rates
- Regional pricing strategies
- Payment gateway integration
- Financial reporting and analytics

### 4. **Business Intelligence**
- Customizable dashboard builder
- KPI configuration and monitoring
- Automated report generation
- Cross-regional analytics

### 5. **Communication Hub**
- Multi-channel communication (Email, SMS, WhatsApp)
- Template management system
- Regional provider configuration
- Delivery tracking and analytics

### 6. **Integration Management**
- Government API integrations
- Banking system connections
- Webhook management
- Third-party service monitoring

### 7. **Security & Compliance**
- Regional compliance monitoring
- Advanced audit logging
- Threat detection and monitoring
- Policy enforcement automation

### 8. **System Administration**
- Performance monitoring
- Cache management
- Automated backup scheduling
- Health monitoring and alerts

This comprehensive directory structure provides a scalable foundation for your multi-regional accounting firm platform with enterprise-grade settings management capabilities.