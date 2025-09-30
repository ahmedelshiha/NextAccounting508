// src/types/settings.ts
// Re-usable TypeScript types for settings import/export payloads

export type SettingsExport = {
  version: string
  generatedAt: string
  tenantId?: string
  payload: Record<string, any>
}

export type SettingsImportOptions = {
  sections?: string[] // list of category keys to import
  overwrite?: boolean
}
