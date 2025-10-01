import { z } from 'zod'

export interface SettingsExportBundle<T> {
  version: '1.0.0'
  category: string
  exportedAt: string
  data: T
}

export interface SettingsImportBundle<T> {
  version?: string
  category?: string
  data: T
}

export function buildExportBundle<T>(category: string, data: T): SettingsExportBundle<T> {
  return {
    version: '1.0.0',
    category,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function isBundleLike(x: any): x is SettingsImportBundle<any> {
  return x && typeof x === 'object' && 'data' in x
}

export function validateImportWithSchema<T>(payload: unknown, schema: z.ZodSchema<T>): T {
  const input = isBundleLike(payload) ? (payload as SettingsImportBundle<T>).data : payload
  const parsed = schema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid import payload')
  return parsed.data
}
