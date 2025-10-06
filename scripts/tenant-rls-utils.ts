import prisma from '../src/lib/prisma'
import prisma from '../src/lib/prisma'
import { setTenantRLSOnTx } from '../src/lib/prisma-rls'

type ResolveTenantOptions = {
  envVar?: string
  flagName?: string
  defaultValue?: string
  required?: boolean
}

function readArgValue(flagName: string): string | null {
  const flag = `--${flagName}`
  const exactIndex = process.argv.indexOf(flag)
  if (exactIndex >= 0) {
    const nextValue = process.argv[exactIndex + 1]
    if (nextValue && !nextValue.startsWith('--')) {
      return nextValue.trim()
    }
  }

  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`))
  if (inline) {
    const [, value] = inline.split('=')
    if (value) return value.trim()
  }

  return null
}

export function resolveTenantId(options: ResolveTenantOptions = {}): string {
  const envVar = options.envVar || 'TENANT_ID'
  const flagName = options.flagName || 'tenant'
  const defaultValue = options.defaultValue
  const required = options.required ?? true

  const fromEnv = process.env[envVar]
  const fromArgs = readArgValue(flagName)

  const tenantId = (fromArgs || fromEnv || defaultValue || '').trim()

  if (!tenantId) {
    if (required) {
      throw new Error(
        `Tenant id missing. Provide via ${envVar} environment variable or --${flagName}=<tenantId> argument.`
      )
    }
    return ''
  }

  return tenantId
}

export async function runWithTenantRLSContext<T>(tenantId: string, fn: (tx: any) => Promise<T>): Promise<T> {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('runWithTenantRLSContext requires a tenantId string')
  }

  return prisma.$transaction(async (tx: any) => {
    await setTenantRLSOnTx(tx, tenantId)
    return fn(tx)
  })
}

export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (err) {
    if (process.env.DEBUG) {
      console.warn('Failed to disconnect prisma during script shutdown:', err)
    }
  }
}

export { prisma }
