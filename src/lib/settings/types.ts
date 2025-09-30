// src/lib/settings/types.ts
// Core types for the Settings registry and tabs

import type { z } from 'zod'

// A Permission in this codebase is represented by a string key (e.g. 'BOOKING_SETTINGS_EDIT').
// Keep the alias broad to avoid coupling to a specific permissions implementation here.
export type Permission = string

export type SettingsCategoryKey =
  | 'organization'
  | 'serviceManagement'
  | 'booking'
  | 'clientManagement'
  | 'taskWorkflow'
  | 'teamManagement'
  | 'financial'
  | 'analyticsReporting'
  | 'communication'
  | 'securityCompliance'
  | 'integrationHub'
  | 'systemAdministration'

// Each tab exposes a typed get/put contract. Concrete schemas (Zod) are provided by category modules.
export interface SettingsTab<Schema = any> {
  key: string
  label: string
  description?: string
  // Permission required to view/edit this tab. Implementation may check this before rendering the tab or calling the API.
  permission?: Permission
  // Lightweight client helpers to fetch and persist data for the tab. Implementations should be provided by per-category modules.
  get?: (tenantId?: string) => Promise<Schema>
  put?: (payload: Schema, tenantId?: string) => Promise<Schema>
}

export interface SettingsCategory {
  key: SettingsCategoryKey
  label: string
  route: string
  // Icon is a React component that receives className (lucide-react compatible)
  icon?: (props: { className?: string }) => JSX.Element
  tabs?: SettingsTab<any>[]
}

// Re-export Zod type helper for convenience in category implementations
export type ZodSchema<T> = z.ZodType<T, any>
