# Enhanced Admin Footer Implementation Guide

**Document Version:** 1.0.0  
**Framework:** Next.js 14 + TypeScript  
**Estimated Duration:** 1 week (30-40 hours)  
**Complexity:** Low-Moderate  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview & Goals](#overview--goals)
2. [Architecture & Design](#architecture--design)
3. [Component Specifications](#component-specifications)
4. [System Health Monitoring](#system-health-monitoring)
5. [Implementation Steps](#implementation-steps)
6. [Builder.io Integration](#builderio-integration)
7. [GitHub Workflow](#github-workflow)
8. [Code Examples](#code-examples)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Checklist](#deployment-checklist)

---

## Overview & Goals

### Current State

Existing Footer (`src/components/admin/layout/Footer/AdminFooter.tsx`):

- Basic single-row layout
- Minimal information display
- No real-time status monitoring
- Limited mobile responsiveness
- Static copyright notice

### Desired State

Enhanced Footer provides:

- Professional three-column responsive layout
- Real-time system health monitoring
- Product information with version tracking
- Quick action links with icons
- Support and documentation access
- Environment badge (production/staging/dev)
- Animated status indicators
- Mobile-optimized drawer layout

### Goals

- **Visual Polish:** Professional appearance matching QuickBooks style
- **Real-time Monitoring:** Live system health status
- **Information Architecture:** Clear, scannable footer content
- **Responsive Design:** Works on all breakpoints
- **Performance:** Zero layout shift, < 50ms render
- **Accessibility:** WCAG 2.1 AA compliant
- **Reliability:** Graceful degradation if APIs fail

### User Stories

**AS AN** admin user  
**I WANT TO** see system status in the footer  
**SO THAT** I know if the system is operating normally

**AS A** support agent  
**I WANT TO** quickly access documentation and help  
**SO THAT** I can resolve issues faster

**AS A** product team member  
**I WANT TO** know which environment I'm in  
**SO THAT** I don't accidentally modify production

**AS A** mobile user  
**I WANT** footer content to be accessible on my phone  
**SO THAT** I can see status and links without scrolling

### Success Criteria

- [x] Three-column layout on desktop
- [x] Stacked layout on mobile/tablet
- [x] System health API implemented
- [x] Real-time status updates (30-60 second polling)
- [x] All links functional and accessible
- [x] Environment badge displays correctly
- [x] Version info auto-populated from package.json
- [x] No console errors or warnings
- [x] Lighthouse accessibility score: 100
- [x] Mobile responsive: 375px to 1920px
- [x] Animation smooth (60fps)
- [x] Zero layout shift (CLS < 0.001)

---

## Architecture & Design

### Layout Design

#### Desktop Layout (1024px+)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│ Left Column          │ Center Column        │ Right Column       │
│ ─────────────────    │ ──────────────────   │ ───��─────────────  │
│ Product Name         │ System Status        │ Support Section    │
│ Version Info         │ Environment Badge    │ Help Links         │
│ Quick Links          │ (animated indicator) │ Documentation      │
│ (Analytics,          │                      │ Copyright          │
│  Settings,           │ [● Operational]      │                    │
│  Main Site)          │ [production]         │ © 2025 NextAcct    │
└──────────────────────────────────────────────────────────────────┘
```

#### Tablet Layout (768px - 1023px)

```
┌────────────────────────────────────────┐
│ Product Name  │ System Status          │
│ Version       │ [● Operational]        │
├────────────────────────────────────────┤
│ Quick Links (horizontal)               │
│ Analytics | Settings | Main Site       │
├────────────────────────────────────────┤
│ Support Links         │ Copyright      │
│ Help | Documentation  │ © 2025 NextAcct│
└────────────────────────────────────────┘
```

#### Mobile Layout (< 768px)

```
┌──────────────────────┐
│ NextAccounting       │
│ v2.3.2              │
│ [● Operational]      │
├──────────────────────┤
│ Analytics            │
│ Settings             │
│ Help                 │
│ Documentation        │
├──────────────────────┤
│ © 2025 NextAccounting│
└──────────────────────┘
```

### Color & Status Scheme

```typescript
// Status Indicators
const statusColors = {
  operational: {
    dot: 'bg-green-500',      // Animated pulse
    badge: 'bg-green-100 text-green-800',
    text: 'text-green-700',
  },
  degraded: {
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-800',
    text: 'text-yellow-700',
  },
  outage: {
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-700',
  },
}

// Environment Colors
const environmentColors = {
  production: 'bg-blue-100 text-blue-800',
  staging: 'bg-purple-100 text-purple-800',
  development: 'bg-orange-100 text-orange-800',
}
```

### Component Structure

```
AdminFooter (Container)
├── FooterSection (Reusable grid item)
│   └── Content varies by position
│
├── Left Section
│   ├── ProductInfo
│   │   ├── Name
│   │   ├── Version
│   │   └── BuildDate
│   └── QuickLinks
│       ├── Link (Analytics)
│       ├── Link (Settings)
│       └── Link (Main Site)
│
├── Center Section
│   ├── SystemStatus
│   │   ├── StatusDot (animated)
│   │   ├── StatusText
│   │   └── Timestamp
│   └── EnvironmentBadge
│       └── Environment label
│
└── Right Section
    ├── SupportLinks
    │   ├── Link (Help)
    │   ├── Link (Documentation)
    │   └── Link (API Docs)
    └── Copyright
        └── Text
```

### Data Flow

```
System Health API (/api/admin/system/health)
        ↓
useSystemHealth Hook (SWR with polling)
        ↓
AdminFooter Component
├── useSWR (30s interval)
├── localStorage fallback
├── Error handling
└── Real-time UI updates
        ↓
Visual Status Display
├── Color changes
├── Text updates
├── Timestamp refresh
└── Accessible announcements
```

---

## Component Specifications

### AdminFooter (Root Component)

**File:** `src/components/admin/layout/Footer/AdminFooter.tsx`

```typescript
interface AdminFooterProps {
  className?: string
}

interface SystemHealth {
  status: 'operational' | 'degraded' | 'outage'
  message: string
  checks: {
    database: HealthCheck
    redis?: HealthCheck
    api: HealthCheck
    storage?: HealthCheck
  }
  timestamp: string
  uptime?: number
}

interface HealthCheck {
  status: 'operational' | 'degraded' | 'outage'
  latency?: number
  lastChecked?: string
}
```

**Key Features:**
- Responsive grid layout (1/3/1 columns on desktop, stacked on mobile)
- Real-time health monitoring with SWR
- Fallback states for API failures
- Accessible status announcements
- Mobile-optimized drawer variant

### ProductInfo Component

**File:** `src/components/admin/layout/Footer/ProductInfo.tsx`

```typescript
interface ProductInfoProps {
  version?: string
  buildDate?: string
  collapsed?: boolean // Mobile drawer mode
}
```

**Displays:**
- NextAccounting branding
- Version from package.json / env var
- Build date (auto-populated)
- Responsive font sizing

**Version Priority:**
1. `env.NEXT_PUBLIC_APP_VERSION`
2. `package.json` version
3. Fallback: "Unknown"

### SystemStatus Component

**File:** `src/components/admin/layout/Footer/SystemStatus.tsx`

```typescript
interface SystemStatusProps {
  health?: SystemHealth
  loading?: boolean
  error?: Error | null
}
```

**Displays:**
- Animated status dot (green/yellow/red)
- Status text (Operational/Degraded/Outage)
- Environment badge (production/staging/dev)
- Last checked timestamp
- Accessibility: aria-live region for updates

**Animations:**
- Status dot pulses when operational
- Color transition when status changes
- Timestamp updates every 30 seconds

### QuickLinks Component

**File:** `src/components/admin/layout/Footer/QuickLinks.tsx`

```typescript
interface QuickLink {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  external?: boolean
}
```

**Links:**
1. Analytics → `/admin/analytics`
2. Settings → `/admin/settings`
3. Main Site → `/` (or configurable)
4. Documentation → `/docs` (external)
5. API Docs → `https://docs.api.example.com` (external)

**Features:**
- Icon + label on desktop
- Icon only on mobile (with tooltip)
- External link indicators
- Keyboard accessible
- Hover/focus states

### SupportLinks Component

**File:** `src/components/admin/layout/Footer/SupportLinks.tsx`

```typescript
interface SupportLinksProps {
  includeApidocs?: boolean
}
```

**Links:**
1. Help & Support → `/admin/help`
2. Documentation → `/docs`
3. API Documentation → `/docs/api` (optional)
4. Contact Support → `mailto:support@example.com` (optional)

**Features:**
- Opens in new tab (external links)
- Keyboard accessible
- Consistent styling with quick links

### EnvironmentBadge Component

**File:** `src/components/admin/layout/Footer/EnvironmentBadge.tsx`

```typescript
interface EnvironmentBadgeProps {
  environment?: 'production' | 'staging' | 'development'
}
```

**Logic:**
- Detects from `env.NODE_ENV`
- Or `env.NEXT_PUBLIC_ENVIRONMENT`
- Shows warning on staging/dev
- Colors: Blue (prod), Purple (staging), Orange (dev)

**Display:**
- Badge with text
- Tooltip with explanation
- Hidden in production (optional)

---

## System Health Monitoring

### Health Check API

**File:** `src/app/api/admin/system/health/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

interface HealthCheckResult {
  status: 'operational' | 'degraded' | 'outage'
  latency: number
  error?: string
}

interface SystemHealthResponse {
  status: 'operational' | 'degraded' | 'outage'
  message: string
  checks: {
    database: HealthCheckResult
    redis?: HealthCheckResult
    api: HealthCheckResult
    storage?: HealthCheckResult
  }
  timestamp: string
  uptime?: number
}

export async function GET(request: Request): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // Check Database
    const dbCheck = await checkDatabase()

    // Check Redis (if available)
    const redisCheck = await checkRedis()

    // Check API (self-check)
    const apiCheck = {
      status: 'operational' as const,
      latency: Date.now() - startTime,
    }

    // Check Storage (if applicable)
    const storageCheck = await checkStorage()

    // Determine overall status
    const checks = {
      database: dbCheck,
      redis: redisCheck,
      api: apiCheck,
      storage: storageCheck,
    }

    const overallStatus = determineOverallStatus(checks)
    const message = getStatusMessage(overallStatus, checks)
    const uptime = getUptime()

    return NextResponse.json({
      status: overallStatus,
      message,
      checks,
      timestamp: new Date().toISOString(),
      uptime,
    })
  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json(
      {
        status: 'outage',
        message: 'System health check failed',
        checks: {
          database: { status: 'unknown', latency: 0 },
          api: { status: 'outage', latency: Date.now() - startTime },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start

    if (latency > 1000) {
      return {
        status: 'degraded',
        latency,
        error: 'Database latency high',
      }
    }

    return { status: 'operational', latency }
  } catch (error) {
    return {
      status: 'outage',
      latency: Date.now() - start,
      error: 'Database connection failed',
    }
  }
}

async function checkRedis(): Promise<HealthCheckResult | undefined> {
  if (!redis) return undefined

  const start = Date.now()
  try {
    await redis.ping()
    const latency = Date.now() - start

    if (latency > 500) {
      return {
        status: 'degraded',
        latency,
        error: 'Redis latency high',
      }
    }

    return { status: 'operational', latency }
  } catch (error) {
    // Redis is optional
    return {
      status: 'degraded',
      latency: Date.now() - start,
      error: 'Redis unavailable (non-critical)',
    }
  }
}

async function checkStorage(): Promise<HealthCheckResult | undefined> {
  // Implement based on your storage solution
  // (S3, GCS, Azure Blob, etc.)
  return undefined
}

function determineOverallStatus(
  checks: Record<string, HealthCheckResult>
): 'operational' | 'degraded' | 'outage' {
  const critical = ['database', 'api']
  const criticalFailing = critical.filter(
    (key) => checks[key]?.status === 'outage'
  )

  if (criticalFailing.length > 0) return 'outage'

  const anyDegraded = Object.values(checks).some(
    (check) => check?.status === 'degraded'
  )

  return anyDegraded ? 'degraded' : 'operational'
}

function getStatusMessage(
  status: 'operational' | 'degraded' | 'outage',
  checks: Record<string, HealthCheckResult>
): string {
  switch (status) {
    case 'operational':
      return 'All systems operational'
    case 'degraded':
      const degradedServices = Object.entries(checks)
        .filter(([, check]) => check?.status === 'degraded')
        .map(([name]) => name)
      return `${degradedServices.join(', ')} running slow`
    case 'outage':
      const downServices = Object.entries(checks)
        .filter(([, check]) => check?.status === 'outage')
        .map(([name]) => name)
      return `${downServices.join(', ')} unavailable`
  }
}

function getUptime(): number | undefined {
  // Calculate uptime from process start
  if (typeof process.uptime === 'function') {
    return Math.floor(process.uptime())
  }
  return undefined
}
```

### useSystemHealth Hook

**File:** `src/hooks/admin/useSystemHealth.ts`

```typescript
import useSWR from 'swr'
import { useEffect, useState } from 'react'

interface UseSystemHealthOptions {
  interval?: number // milliseconds, default 30000
  enabled?: boolean
  onStatusChange?: (status: 'operational' | 'degraded' | 'outage') => void
}

export function useSystemHealth(options: UseSystemHealthOptions = {}) {
  const {
    interval = 30000,
    enabled = true,
    onStatusChange,
  } = options

  const [previousStatus, setPreviousStatus] = useState<string | null>(null)

  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/api/admin/system/health' : null,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Health check failed')
      return res.json()
    },
    {
      revalidateInterval: interval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryInterval: 10000,
      errorRetryCount: 3,
    }
  )

  // Notify on status change
  useEffect(() => {
    if (data?.status && data.status !== previousStatus) {
      setPreviousStatus(data.status)
      onStatusChange?.(data.status)
    }
  }, [data?.status, previousStatus, onStatusChange])

  return {
    health: data,
    error,
    isLoading,
    mutate,
    status: data?.status || 'unknown',
    message: data?.message || 'Checking system status...',
    timestamp: data?.timestamp,
  }
}
```

### Environment Detection

**File:** `src/lib/admin/environment.ts`

```typescript
export type Environment = 'production' | 'staging' | 'development'

export function getEnvironment(): Environment {
  // Priority:
  // 1. Explicit env var
  // 2. Detect from NODE_ENV
  // 3. Detect from URL
  // 4. Default to development

  const explicit = process.env.NEXT_PUBLIC_ENVIRONMENT as Environment | undefined
  if (explicit) return explicit

  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') return 'production'

  // Detect from hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname.includes('staging')) return 'staging'
    if (hostname === 'localhost' || hostname === '127.0.0.1')
      return 'development'
  }

  return 'development'
}

export function getEnvironmentColor(
  env: Environment
): 'blue' | 'purple' | 'orange' {
  switch (env) {
    case 'production':
      return 'blue'
    case 'staging':
      return 'purple'
    case 'development':
      return 'orange'
  }
}

export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

export function isStaging(): boolean {
  return getEnvironment() === 'staging'
}

export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}
```

---

## Implementation Steps

### Phase 1: Setup (Day 1)

#### Step 1.1: Create Directory Structure

```bash
mkdir -p src/components/admin/layout/Footer
mkdir -p src/components/admin/layout/Footer/__tests__
mkdir -p src/app/api/admin/system
mkdir -p src/lib/admin
mkdir -p src/hooks/admin
```

#### Step 1.2: Create Files

```bash
# Components
touch src/components/admin/layout/Footer/AdminFooter.tsx
touch src/components/admin/layout/Footer/ProductInfo.tsx
touch src/components/admin/layout/Footer/SystemStatus.tsx
touch src/components/admin/layout/Footer/QuickLinks.tsx
touch src/components/admin/layout/Footer/SupportLinks.tsx
touch src/components/admin/layout/Footer/EnvironmentBadge.tsx
touch src/components/admin/layout/Footer/types.ts
touch src/components/admin/layout/Footer/constants.ts

# API
touch src/app/api/admin/system/health/route.ts

# Utilities
touch src/lib/admin/environment.ts
touch src/lib/admin/version.ts

# Hooks
touch src/hooks/admin/useSystemHealth.ts

# Tests
touch src/components/admin/layout/Footer/__tests__/AdminFooter.test.tsx
touch src/hooks/admin/__tests__/useSystemHealth.test.ts
```

#### Step 1.3: Create Constants & Types

**File:** `src/components/admin/layout/Footer/constants.ts`

```typescript
export const FOOTER_LINKS = {
  quickLinks: [
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/admin/analytics',
      icon: 'BarChart3',
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/admin/settings',
      icon: 'Settings',
    },
    {
      id: 'main-site',
      label: 'Main Site',
      href: '/',
      icon: 'ExternalLink',
    },
  ],
  supportLinks: [
    {
      id: 'help',
      label: 'Help',
      href: '/admin/help',
      icon: 'HelpCircle',
    },
    {
      id: 'docs',
      label: 'Documentation',
      href: '/docs',
      icon: 'FileText',
      external: true,
    },
    {
      id: 'api-docs',
      label: 'API Docs',
      href: 'https://docs.api.example.com',
      icon: 'Code',
      external: true,
    },
  ],
}

export const HEALTH_CHECK_CONFIG = {
  pollInterval: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 10000, // 10 seconds
  timeout: 5000, // 5 seconds
}

export const STATUS_MESSAGES = {
  operational: 'All systems operational',
  degraded: 'Some services running slow',
  outage: 'Service outage detected',
  checking: 'Checking system status...',
  unknown: 'Status unavailable',
}
```

**File:** `src/components/admin/layout/Footer/types.ts`

```typescript
export interface SystemHealth {
  status: 'operational' | 'degraded' | 'outage'
  message: string
  checks: Record<string, HealthCheck>
  timestamp: string
  uptime?: number
}

export interface HealthCheck {
  status: 'operational' | 'degraded' | 'outage' | 'unknown'
  latency?: number
  error?: string
  lastChecked?: string
}

export interface FooterLink {
  id: string
  label: string
  href: string
  icon?: string
  external?: boolean
}

export interface AdminFooterProps {
  className?: string
  hideHealth?: boolean
  hideEnvironment?: boolean
  customLinks?: FooterLink[]
}
```

### Phase 2: Components (Days 2-3)

#### Step 2.1: Build AdminFooter Root Component

**File:** `src/components/admin/layout/Footer/AdminFooter.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useResponsive } from '@/hooks/admin/useResponsive'
import { useSystemHealth } from '@/hooks/admin/useSystemHealth'
import { ProductInfo } from './ProductInfo'
import { SystemStatus } from './SystemStatus'
import { QuickLinks } from './QuickLinks'
import { SupportLinks } from './SupportLinks'
import { EnvironmentBadge } from './EnvironmentBadge'
import { HEALTH_CHECK_CONFIG } from './constants'
import type { AdminFooterProps } from './types'

export function AdminFooter({
  className,
  hideHealth = false,
  hideEnvironment = false,
  customLinks,
}: AdminFooterProps) {
  const { isMobile, isTablet } = useResponsive()
  const { health, error, isLoading, status, message } = useSystemHealth({
    interval: HEALTH_CHECK_CONFIG.pollInterval,
    enabled: !hideHealth,
  })

  const footerClasses = `
    bg-white border-t border-gray-200 mt-auto
    ${className || ''}
  `

  if (isMobile) {
    return <MobileFooter
      health={health}
      error={error}
      isLoading={isLoading}
      status={status}
      hideEnvironment={hideEnvironment}
    />
  }

  if (isTablet) {
    return <TabletFooter
      health={health}
      error={error}
      isLoading={isLoading}
      status={status}
      hideEnvironment={hideEnvironment}
    />
  }

  // Desktop
  return (
    <footer
      className={footerClasses}
      role="contentinfo"
      aria-label="Admin dashboard footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-8 py-4 items-center text-sm">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <ProductInfo />

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <QuickLinks links={customLinks} />
            </div>
          </div>

          {/* Center Section */}
          <div className="flex items-center justify-center gap-2">
            {!hideHealth && (
              <SystemStatus
                health={health}
                loading={isLoading}
                error={error}
              />
            )}

            {!hideEnvironment && <EnvironmentBadge />}
          </div>

          {/* Right Section */}
          <div className="flex items-center justify-end gap-6">
            <div className="flex items-center gap-4">
              <SupportLinks />
            </div>

            <div className="text-xs text-gray-400 border-l border-gray-200 pl-4">
              © {new Date().getFullYear()} NextAccounting
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function MobileFooter({
  health,
  error,
  isLoading,
  status,
  hideEnvironment,
}: {
  health?: any
  error?: any
  isLoading?: boolean
  status?: string
  hideEnvironment?: boolean
}) {
  return (
    <footer className="bg-white border-t border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <ProductInfo />
        <div className="flex items-center gap-2">
          <SystemStatus
            health={health}
            loading={isLoading}
            error={error}
            compact
          />
          {!hideEnvironment && <EnvironmentBadge compact />}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <QuickLinks compact />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs text-gray-500">
        <SupportLinks compact />
        <span>© {new Date().getFullYear()} NextAccounting</span>
      </div>
    </footer>
  )
}

function TabletFooter({
  health,
  error,
  isLoading,
  status,
  hideEnvironment,
}: {
  health?: any
  error?: any
  isLoading?: boolean
  status?: string
  hideEnvironment?: boolean
}) {
  return (
    <footer className="bg-white border-t border-gray-200 py-3 px-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <ProductInfo />
          <div className="flex items-center gap-2">
            <SystemStatus
              health={health}
              loading={isLoading}
              error={error}
            />
            {!hideEnvironment && <EnvironmentBadge />}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <QuickLinks />
          <SupportLinks />
        </div>

        <div className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} NextAccounting
        </div>
      </div>
    </footer>
  )
}
```

#### Step 2.2: Build ProductInfo Component

**File:** `src/components/admin/layout/Footer/ProductInfo.tsx`

```typescript
'use client'

import { getAppVersion, getBuildDate } from '@/lib/admin/version'

interface ProductInfoProps {
  compact?: boolean
}

export function ProductInfo({ compact }: ProductInfoProps) {
  const version = getAppVersion()
  const buildDate = getBuildDate()

  if (compact) {
    return (
      <div className="text-xs">
        <div className="font-semibold text-gray-900">NextAccounting</div>
        <div className="text-gray-500">{version}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <span className="font-semibold text-gray-900">
        NextAccounting Admin
      </span>
      <span className="text-xs text-gray-500">
        {version} · {buildDate}
      </span>
    </div>
  )
}
```

#### Step 2.3: Build SystemStatus Component

**File:** `src/components/admin/layout/Footer/SystemStatus.tsx`

```typescript
'use client'

import { Badge } from '@/components/ui/badge'
import { STATUS_MESSAGES } from './constants'
import type { SystemHealth } from './types'

interface SystemStatusProps {
  health?: SystemHealth
  loading?: boolean
  error?: Error | null
  compact?: boolean
}

export function SystemStatus({
  health,
  loading,
  error,
  compact,
}: SystemStatusProps) {
  const status = health?.status || 'unknown'
  const message = health?.message || STATUS_MESSAGES.checking

  const statusConfig = {
    operational: {
      color: 'bg-green-100 text-green-800',
      dotColor: 'bg-green-500',
      textColor: 'text-green-700',
    },
    degraded: {
      color: 'bg-yellow-100 text-yellow-800',
      dotColor: 'bg-yellow-500',
      textColor: 'text-yellow-700',
    },
    outage: {
      color: 'bg-red-100 text-red-800',
      dotColor: 'bg-red-500',
      textColor: 'text-red-700',
    },
    unknown: {
      color: 'bg-gray-100 text-gray-800',
      dotColor: 'bg-gray-400',
      textColor: 'text-gray-700',
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${config.dotColor} ${
            status === 'operational' ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
        <span className="text-xs font-medium hidden sm:inline">
          {status === 'operational' ? 'OK' : status === 'degraded' ? 'Slow' : 'Down'}
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
      aria-label={`System status: ${message}`}
    >
      {/* Animated Status Dot */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.color}`}
      >
        <div
          className={`w-2 h-2 rounded-full ${config.dotColor} ${
            status === 'operational' ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
        <span className="text-xs font-medium">{message}</span>
      </div>

      {/* Timestamp */}
      {health?.timestamp && (
        <span className="text-xs text-gray-500 hidden md:inline">
          {new Date(health.timestamp).toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}
```

#### Step 2.4: Build QuickLinks Component

**File:** `src/components/admin/layout/Footer/QuickLinks.tsx`

```typescript
'use client'

import Link from 'next/link'
import {
  BarChart3,
  Settings,
  ExternalLink,
  HelpCircle,
  FileText,
} from 'lucide-react'
import { FOOTER_LINKS } from './constants'
import type { FooterLink } from './types'

interface QuickLinksProps {
  links?: FooterLink[]
  compact?: boolean
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Settings,
  ExternalLink,
  HelpCircle,
  FileText,
}

export function QuickLinks({ links = FOOTER_LINKS.quickLinks, compact }: QuickLinksProps) {
  return (
    <nav className="flex items-center gap-3 sm:gap-4" aria-label="Quick links">
      {links.map((link) => {
        const Icon = link.icon ? iconMap[link.icon] : null
        
        return (
          <Link
            key={link.id}
            href={link.href}
            {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-1"
          >
            {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
            {!compact && <span className="text-sm">{link.label}</span>}
            {link.external && !compact && (
              <ExternalLink className="w-3 h-3 ml-1" aria-hidden="true" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
```

#### Step 2.5: Build SupportLinks Component

**File:** `src/components/admin/layout/Footer/SupportLinks.tsx`

```typescript
'use client'

import Link from 'next/link'
import {
  HelpCircle,
  FileText,
  Code,
} from 'lucide-react'
import { FOOTER_LINKS } from './constants'
import type { FooterLink } from './types'

interface SupportLinksProps {
  links?: FooterLink[]
  compact?: boolean
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HelpCircle,
  FileText,
  Code,
}

export function SupportLinks({
  links = FOOTER_LINKS.supportLinks,
  compact,
}: SupportLinksProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {links.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label={link.label}
          >
            <span className="text-xs">{link.label}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <nav aria-label="Support links">
        <div className="flex flex-col items-end gap-1">
          {links.map((link) => {
            const Icon = link.icon ? iconMap[link.icon] : null

            return (
              <Link
                key={link.id}
                href={link.href}
                {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
              >
                {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
```

#### Step 2.6: Build EnvironmentBadge Component

**File:** `src/components/admin/layout/Footer/EnvironmentBadge.tsx`

```typescript
'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getEnvironment, getEnvironmentColor } from '@/lib/admin/environment'
import { AlertCircle } from 'lucide-react'

interface EnvironmentBadgeProps {
  compact?: boolean
  hideProduction?: boolean
}

export function EnvironmentBadge({
  compact,
  hideProduction = true,
}: EnvironmentBadgeProps) {
  const environment = getEnvironment()
  const color = getEnvironmentColor(environment)

  // Hide badge in production if hideProduction is true
  if (hideProduction && environment === 'production') {
    return null
  }

  const colorMap = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
  }

  const description = {
    production: 'Production environment - be careful with changes',
    staging: 'Staging environment - test before production',
    development: 'Development environment - safe for testing',
  }

  const environmentLabel = environment.charAt(0).toUpperCase() + environment.slice(1)

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className={`text-xs ${colorMap[color]}`}>
              {environmentLabel}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top">
            {description[environment as keyof typeof description]}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={`text-xs font-normal ${colorMap[color]}`}>
            {environment === 'production' && (
              <AlertCircle className="w-3 h-3 mr-1" aria-hidden="true" />
            )}
            {environmentLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {description[environment as keyof typeof description]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### Phase 3: Utilities (Days 3-4)

#### Step 3.1: Version Detection

**File:** `src/lib/admin/version.ts`

```typescript
export function getAppVersion(): string {
  // Priority:
  // 1. Environment variable (for CI/CD)
  // 2. package.json version (build-time)
  // 3. Fallback

  const envVersion = process.env.NEXT_PUBLIC_APP_VERSION
  if (envVersion) return `v${envVersion}`

  try {
    // This requires importing package.json
    const pkg = require('../../../package.json')
    return `v${pkg.version}`
  } catch {
    // Fallback
    return 'v2.3.2'
  }
}

export function getBuildDate(): string {
  // Priority:
  // 1. Build date environment variable
  // 2. Current date (if not built)
  // 3. Fixed date

  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE
  if (buildDate) return buildDate

  // If running in development, show "Dev"
  if (process.env.NODE_ENV === 'development') {
    return 'Development'
  }

  // Format: "Sept 26, 2025"
  const date = new Date()
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getBuildTime(): string {
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME
  if (buildTime) return buildTime

  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
```

#### Step 3.2: Environment Detection

**File:** `src/lib/admin/environment.ts`

```typescript
export type Environment = 'production' | 'staging' | 'development'

export function getEnvironment(): Environment {
  // Priority:
  // 1. Explicit environment variable
  // 2. NODE_ENV detection
  // 3. URL hostname detection
  // 4. Default

  const explicit = process.env.NEXT_PUBLIC_ENVIRONMENT as Environment | undefined
  if (explicit) return explicit

  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') return 'production'

  // Detect from hostname if client-side
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname

    if (hostname.includes('prod') || hostname.includes('nextaccounting.com')) {
      return 'production'
    }

    if (hostname.includes('staging') || hostname.includes('stg')) {
      return 'staging'
    }

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0'
    ) {
      return 'development'
    }
  }

  return 'development'
}

export function getEnvironmentColor(env: Environment): 'blue' | 'purple' | 'orange' {
  switch (env) {
    case 'production':
      return 'blue'
    case 'staging':
      return 'purple'
    case 'development':
      return 'orange'
  }
}

export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

export function isStaging(): boolean {
  return getEnvironment() === 'staging'
}

export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}

export function getEnvironmentDescription(env: Environment): string {
  switch (env) {
    case 'production':
      return 'Production - Active user data'
    case 'staging':
      return 'Staging - Test environment before production'
    case 'development':
      return 'Development - Local testing environment'
  }
}
```

### Phase 4: API Setup (Day 4)

#### Step 4.1: Health Check Endpoint

**File:** `src/app/api/admin/system/health/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const HEALTH_TIMEOUT = 5000 // 5 seconds

interface HealthCheckResult {
  status: 'operational' | 'degraded' | 'outage' | 'unknown'
  latency: number
  error?: string
}

interface SystemHealthResponse {
  status: 'operational' | 'degraded' | 'outage'
  message: string
  checks: {
    database: HealthCheckResult
    redis?: HealthCheckResult
    api: HealthCheckResult
  }
  timestamp: string
  uptime?: number
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  )
  return Promise.race([promise, timeoutPromise])
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, HEALTH_TIMEOUT)

    const latency = Date.now() - start

    if (latency > 1000) {
      return {
        status: 'degraded',
        latency,
        error: 'Database latency high (>1000ms)',
      }
    }

    return {
      status: 'operational',
      latency,
    }
  } catch (error) {
    return {
      status: 'outage',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkRedis(): Promise<HealthCheckResult | undefined> {
  if (!redis) return undefined

  const start = Date.now()

  try {
    await withTimeout(redis.ping(), HEALTH_TIMEOUT)

    const latency = Date.now() - start

    if (latency > 500) {
      return {
        status: 'degraded',
        latency,
        error: 'Redis latency high (>500ms)',
      }
    }

    return {
      status: 'operational',
      latency,
    }
  } catch (error) {
    // Redis is optional, so downgrade to degraded
    return {
      status: 'degraded',
      latency: Date.now() - start,
      error: 'Redis unavailable (non-critical)',
    }
  }
}

function determineOverallStatus(
  checks: Record<string, HealthCheckResult | undefined>
): 'operational' | 'degraded' | 'outage' {
  const critical = ['database', 'api']
  const criticalFailing = critical.filter(
    (key) => checks[key]?.status === 'outage'
  )

  if (criticalFailing.length > 0) return 'outage'

  const anyDegraded = Object.values(checks).some(
    (check) => check?.status === 'degraded'
  )

  return anyDegraded ? 'degraded' : 'operational'
}

function getStatusMessage(
  status: 'operational' | 'degraded' | 'outage',
  checks: Record<string, HealthCheckResult | undefined>
): string {
  switch (status) {
    case 'operational':
      return 'All systems operational'
    case 'degraded':
      const degradedServices = Object.entries(checks)
        .filter(([, check]) => check?.status === 'degraded')
        .map(([name]) => name)
      return `${degradedServices.join(', ')} running slow`
    case 'outage':
      const downServices = Object.entries(checks)
        .filter(([, check]) => check?.status === 'outage')
        .map(([name]) => name)
      return `${downServices.join(', ')} unavailable`
  }
}

function getUptime(): number | undefined {
  if (typeof process.uptime === 'function') {
    return Math.floor(process.uptime())
  }
  return undefined
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // Check Database
    const dbCheck = await checkDatabase()

    // Check Redis (if available)
    const redisCheck = await checkRedis()

    // Check API (self-check)
    const apiCheck = {
      status: 'operational' as const,
      latency: Date.now() - startTime,
    }

    // Determine overall status
    const checks = {
      database: dbCheck,
      redis: redisCheck,
      api: apiCheck,
    }

    const overallStatus = determineOverallStatus(checks)
    const message = getStatusMessage(overallStatus, checks)
    const uptime = getUptime()

    return NextResponse.json({
      status: overallStatus,
      message,
      checks,
      timestamp: new Date().toISOString(),
      uptime,
    } as SystemHealthResponse)
  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json(
      {
        status: 'outage',
        message: 'System health check failed',
        checks: {
          database: { status: 'unknown', latency: 0 },
          api: { status: 'outage', latency: Date.now() - startTime },
        },
        timestamp: new Date().toISOString(),
      } as SystemHealthResponse,
      { status: 500 }
    )
  }
}
```

---

## Testing Strategy

### Unit Tests

**File:** `src/components/admin/layout/Footer/__tests__/AdminFooter.test.tsx`

- Component renders without crashing
- Responsive layouts switch correctly
- Conditional rendering (hideHealth, hideEnvironment)
- Custom links override defaults

**File:** `src/hooks/admin/__tests__/useSystemHealth.test.ts`

- Hook initializes with correct default values
- SWR polling interval configuration
- Error handling and retry logic
- Status change callbacks

### Integration Tests

- Health check API returns correct status
- Footer updates when health status changes
- Environment detection works correctly
- All links are clickable and navigate correctly

### E2E Tests

- Sidebar render with footer visible
- Status updates over time
- Mobile responsive behavior
- Production environment badge hidden

### Accessibility Tests

- WCAG 2.1 AA compliance check
- Screen reader compatibility
- Keyboard navigation
- Color contrast ratios
- Status announcements (aria-live)

### Performance Tests

- First Paint: < 100ms
- Largest Contentful Paint: < 200ms
- Cumulative Layout Shift: < 0.001
- Health API response: < 500ms

---

## Deployment Checklist

- [ ] All components created and tested
- [ ] Health check API implemented
- [ ] Environment detection working
- [ ] Version display correct
- [ ] Responsive layouts verified on all breakpoints
- [ ] Accessibility audit passed
- [ ] Performance metrics meet targets
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Staging deployment successful
- [ ] Production deployment ready
- [ ] Monitoring and alerts configured

---

## Builder.io Integration (Optional)

If using Builder.io CMS:

- Create footer content model
- Design tokens for colors and spacing
- Responsive layout previews
- Live editing capabilities
- Version auto-publish

---

## GitHub Workflow

```bash
# Feature branch
git checkout -b feature/admin-footer-enhancement

# Make changes and commit
git commit -m "feat: implement enhanced admin footer"

# Push and create PR
git push origin feature/admin-footer-enhancement

# After review and tests pass
git merge --ff-only

# Release
git tag -a v2.4.0 -m "Release: Enhanced admin footer"
git push origin main --tags
```

---

## Summary

This implementation provides a professional, accessible, and performant admin footer with real-time system monitoring. The modular component structure makes it easy to maintain and extend.

**Key Deliverables:**
- 6 reusable components
- System health monitoring API
- Environment detection utilities
- Version management system
- Comprehensive test coverage
- Accessibility compliance
- Performance optimization

**Timeline:** 1 week (30-40 hours)  
**Team Size:** 1-2 developers  
**Complexity:** Low-Moderate
