import { logger } from '@/lib/logger'
import { tenantContext } from '@/lib/tenant-context'
import { isMultiTenancyEnabled } from '@/lib/tenant'
import { incrementMetric } from '@/lib/observability-helpers'
import type { Prisma } from '@prisma/client'

type TenantModelConfig = {
  field: string
  optional: boolean
}

type GuardedAction =
  | 'create'
  | 'createMany'
  | 'upsert'
  | 'updateMany'
  | 'deleteMany'
  | 'update'
  | 'delete'
  | 'findFirst'
  | 'findUnique'
  | 'findMany'
  | 'aggregate'
  | 'count'
  | 'groupBy'

const WRITE_ACTIONS: ReadonlySet<GuardedAction> = new Set(['create', 'createMany', 'upsert'])
const BULK_MUTATION_ACTIONS: ReadonlySet<GuardedAction> = new Set(['updateMany', 'deleteMany'])
const SINGLE_MUTATION_ACTIONS: ReadonlySet<GuardedAction> = new Set(['update', 'delete'])
const READ_ACTIONS: ReadonlySet<GuardedAction> = new Set(['findFirst', 'findUnique', 'findMany', 'aggregate', 'count', 'groupBy'])
const AUTH_MODEL_NAMES: ReadonlySet<string> = new Set(['Account', 'Session', 'VerificationToken'])

let tenantModelConfigs: ReadonlyMap<string, TenantModelConfig> | null = null

function buildTenantModelConfigsFromClient(client: any): ReadonlyMap<string, TenantModelConfig> {
  const configs = new Map<string, TenantModelConfig>()
  // Try to read DMMF from client internals (supports different Prisma versions)
  const dmmfModels = (client && (client._dmmf?.datamodel?.models || client._baseDmmf?.datamodel?.models)) || []

  for (const model of dmmfModels as any[]) {
    const tenantField = (model.fields || []).find((field: any) => field.name === 'tenantId')
    if (tenantField) {
      configs.set(model.name, {
        field: tenantField.name,
        optional: !tenantField.isRequired,
      })
    }
  }

  return configs
}

function extractTenantValuesFromScalar(value: unknown): string[] {
  if (typeof value === 'string' && value.trim().length > 0) return [value]
  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>
    if (typeof candidate.equals === 'string') return [candidate.equals]
    if (Array.isArray(candidate.in)) {
      return candidate.in.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
    if (typeof candidate.set === 'string') return [candidate.set]
  }
  return []
}

function collectTenantValues(input: unknown, tenantField: string): string[] {
  if (!input || typeof input !== 'object') return []

  const values: string[] = []
  const record = input as Record<string, unknown>

  if (tenantField in record) {
    values.push(...extractTenantValuesFromScalar(record[tenantField]))
  }

  for (const [key, value] of Object.entries(record)) {
    if (!value || typeof value !== 'object') continue
    if (key === 'AND' || key === 'OR' || key === 'NOT') {
      const clauses = Array.isArray(value) ? value : [value]
      for (const clause of clauses) values.push(...collectTenantValues(clause, tenantField))
    } else if (key.toLowerCase().includes('tenant')) {
      values.push(...collectTenantValues(value, tenantField))
    }
  }

  return Array.from(new Set(values.filter(v => typeof v === 'string' && v.trim().length > 0)))
}

function ensureArgsObject(params: any): Record<string, any> {
  if (!params.args || typeof params.args !== 'object') {
    params.args = {}
  }
  return params.args as Record<string, any>
}

function ensureTenantScopeOnWhere(args: Record<string, any>, tenantField: string, tenantId: string): boolean {
  if (!args) return false
  const existing = args.where
  if (!existing || typeof existing !== 'object') {
    args.where = { [tenantField]: tenantId }
    return true
  }

  const values = collectTenantValues(existing, tenantField)
  if (!values.length) {
    args.where = { AND: [existing, { [tenantField]: tenantId }] }
    return true
  }

  return false
}

function ensureTenantOnCreateData(data: unknown, tenantField: string, tenantId: string): boolean {
  if (!data) return false
  const records = Array.isArray(data) ? data : [data]
  let mutated = false

  for (const entry of records) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    if (!(tenantField in record) || record[tenantField] == null) {
      record[tenantField] = tenantId
      mutated = true
    }
  }

  return mutated
}

function assertTenantForCreate(
  model: string,
  action: GuardedAction,
  data: unknown,
  tenantField: string,
  expectedTenantId: string,
  allowDifferentTenant: boolean,
  allowNullForOptional: boolean
) {
  const records = Array.isArray(data) ? data : [data]

  for (const entry of records) {
    if (!entry || typeof entry !== 'object') {
      logger.error('Tenant guard blocked create due to malformed payload', { model, action, reason: 'non-object-record' })
      incrementMetric('tenant_guard.error.create.malformed', { model: String(model), action: String(action) })
      throw new Error('Tenant guard: invalid create payload')
    }
    const record = entry as Record<string, unknown>
    const rawTenantValue = record[tenantField]
    const values = extractTenantValuesFromScalar(rawTenantValue)

    if (!values.length) {
      if (allowNullForOptional && rawTenantValue == null) return
      logger.error('Tenant guard blocked create without tenantId', { model, action })
      incrementMetric('tenant_guard.error.create.missing_tenant', { model: String(model), action: String(action) })
      throw new Error('Tenant guard: tenantId is required for tenant-scoped create')
    }

    for (const provided of values) {
      if (!allowDifferentTenant && provided !== expectedTenantId) {
        logger.error('Tenant guard blocked tenant mismatch on create', { model, action, expectedTenantId, providedTenantId: provided })
        incrementMetric('tenant_guard.error.create.mismatch', { model: String(model), action: String(action) })
        throw new Error('Tenant guard: tenantId mismatch')
      }
    }
  }
}

function assertTenantForBulkWhere(
  model: string,
  action: GuardedAction,
  where: unknown,
  tenantField: string,
  expectedTenantId: string,
  allowDifferentTenant: boolean
) {
  const values = collectTenantValues(where ?? {}, tenantField)
  if (!values.length) {
    logger.error('Tenant guard blocked bulk mutation without tenant scope', { model, action })
    incrementMetric('tenant_guard.error.bulk.missing_scope', { model: String(model), action: String(action) })
    throw new Error('Tenant guard: bulk mutations require tenant filter')
  }
  if (!allowDifferentTenant && values.some(value => value !== expectedTenantId)) {
    logger.error('Tenant guard blocked mismatched tenant scope on bulk mutation', { model, action, expectedTenantId, providedTenantIds: values })
    incrementMetric('tenant_guard.error.bulk.mismatch', { model: String(model), action: String(action) })
    throw new Error('Tenant guard: bulk mutation tenant mismatch')
  }
}

function logReadWithoutTenant(model: string, action: GuardedAction, where: unknown, tenantField: string, tenantId: string) {
  const values = collectTenantValues(where ?? {}, tenantField)
  if (!values.length) {
    logger.warn('Tenant guard detected read without tenant constraint', { model, action, tenantId })
    incrementMetric('tenant_guard.warn.read_without_tenant', { model: String(model), action: String(action) })
  }
}

export function enforceTenantGuard(params: any): void {
  if (!isMultiTenancyEnabled()) return
  const model = params.model
  if (!model) return

  if (AUTH_MODEL_NAMES.has(model)) return

  const requestUrl =
    typeof params?.args?.context?.req?.url === 'string'
      ? params.args.context.req.url
      : null
  if (requestUrl && requestUrl.includes('/api/auth')) return

  const config: TenantModelConfig | null = tenantModelConfigs?.get(model) ?? { field: 'tenantId', optional: true }
  if (!config) return

  const context = tenantContext.getContextOrNull()
  if (!context || !context.tenantId) {
    logger.error('Tenant guard blocked operation due to missing tenant context', { model, action: params.action })
    incrementMetric('tenant_guard.error.missing_context', { model: String(model), action: String(params.action) })
    throw new Error('Tenant guard: tenant context is required')
  }

  const action = params.action as GuardedAction
  const allowDifferentTenant = Boolean(context.isSuperAdmin)
  const args = ensureArgsObject(params)

  if (!allowDifferentTenant) {
    if (WRITE_ACTIONS.has(action) && ensureTenantOnCreateData(args.data, config.field, context.tenantId)) {
      logger.debug('Tenant guard auto-injected tenantId on create', { model, action, tenantId: context.tenantId })
    }

    if ((BULK_MUTATION_ACTIONS.has(action) || SINGLE_MUTATION_ACTIONS.has(action) || READ_ACTIONS.has(action)) && ensureTenantScopeOnWhere(args, config.field, context.tenantId)) {
      logger.debug('Tenant guard auto-scoped operation to tenant', { model, action, tenantId: context.tenantId })
    }
  }

  if (WRITE_ACTIONS.has(action)) {
    assertTenantForCreate(
      model,
      action,
      args?.data,
      config.field,
      context.tenantId,
      allowDifferentTenant,
      config.optional && allowDifferentTenant
    )
  }

  if (BULK_MUTATION_ACTIONS.has(action)) {
    assertTenantForBulkWhere(model, action, args?.where, config.field, context.tenantId, allowDifferentTenant)
  }

  if (SINGLE_MUTATION_ACTIONS.has(action) && !allowDifferentTenant) {
    const values = collectTenantValues(args?.where ?? {}, config.field)
    if (values.some(value => value !== context.tenantId)) {
      logger.error('Tenant guard blocked tenant mismatch on mutation', { model, action, expectedTenantId: context.tenantId, providedTenantIds: values })
      incrementMetric('tenant_guard.error.mutation_mismatch', { model: String(model), action: String(action) })
      throw new Error('Tenant guard: tenant mismatch on mutation')
    }
  }

  if (READ_ACTIONS.has(action)) {
    logReadWithoutTenant(model, action, args?.where, config.field, context.tenantId)
  }
}

export function registerTenantGuard(client: any): void {
  const flag = Symbol.for('tenantGuardRegistered')
  const anyClient = client as any
  if (anyClient[flag as any]) return
  anyClient[flag as any] = true

  // Build tenant model configs lazily from client DMMF
  if (!tenantModelConfigs) {
    tenantModelConfigs = buildTenantModelConfigsFromClient(client)
  }

  const applyMiddleware = anyClient['$use'] as any
  if (typeof applyMiddleware === 'function') {
    applyMiddleware(async (params: any, next: any) => {
      enforceTenantGuard(params)
      return next(params)
    })
  }
}
