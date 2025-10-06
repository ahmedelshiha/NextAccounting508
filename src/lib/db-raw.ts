import { withTenantRLS } from '@/lib/prisma-rls'

import { withTenantRLS } from '@/lib/prisma-rls'

type RawInput = TemplateStringsArray | string

function isTemplateStringsArray(input: unknown): input is TemplateStringsArray {
  return Array.isArray(input) && Object.prototype.hasOwnProperty.call(input, 'raw')
}

async function runTenantScopedRaw<T>(
  mode: 'query' | 'execute',
  input: RawInput,
  values: any[],
  tenantId?: string,
  options: { unsafe?: boolean } = {}
): Promise<T> {
  const { unsafe = false } = options

  if (!unsafe && !isTemplateStringsArray(input)) {
    if (typeof input === 'string' && values.length > 0) {
      throw new Error('Tenant raw helpers require tagged template usage for parameterized queries')
    }
    throw new Error('Tenant raw helpers require tagged template literals for safe execution or call the unsafe variant explicitly')
  }

  return withTenantRLS(async tx => {
    if (mode === 'query') {
      if (isTemplateStringsArray(input)) {
        return tx.$queryRaw(input, ...values)
      }
      if (unsafe && typeof tx.$queryRawUnsafe === 'function') {
        return tx.$queryRawUnsafe(input, ...values)
      }
      return tx.$queryRaw(input as any, ...values)
    }

    if (isTemplateStringsArray(input)) {
      const exec = typeof tx.$executeRaw === 'function' ? tx.$executeRaw.bind(tx) : tx.$queryRaw.bind(tx)
      return exec(input, ...values)
    }

    if (unsafe && typeof tx.$executeRawUnsafe === 'function') {
      return tx.$executeRawUnsafe(input, ...values)
    }

    const exec = typeof tx.$executeRaw === 'function' ? tx.$executeRaw.bind(tx) : tx.$queryRaw.bind(tx)
    return exec(input as any, ...values)
  }, tenantId)
}

export async function queryTenantRaw<T = unknown>(input: RawInput, ...values: any[]): Promise<T[]> {
  return runTenantScopedRaw<T[]>('query', input, values)
}

export async function queryTenantRawAs<T = unknown>(tenantId: string, input: RawInput, ...values: any[]): Promise<T[]> {
  return runTenantScopedRaw<T[]>('query', input, values, tenantId)
}

export async function queryTenantRawUnsafe<T = unknown>(input: string, ...values: any[]): Promise<T[]> {
  return runTenantScopedRaw<T[]>('query', input, values, undefined, { unsafe: true })
}

export async function queryTenantRawUnsafeAs<T = unknown>(tenantId: string, input: string, ...values: any[]): Promise<T[]> {
  return runTenantScopedRaw<T[]>('query', input, values, tenantId, { unsafe: true })
}

export async function executeTenantRaw(input: RawInput, ...values: any[]): Promise<number | unknown> {
  return runTenantScopedRaw('execute', input, values)
}

export async function executeTenantRawAs(tenantId: string, input: RawInput, ...values: any[]): Promise<number | unknown> {
  return runTenantScopedRaw('execute', input, values, tenantId)
}
