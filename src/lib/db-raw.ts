import { withTenantRLS } from '@/lib/prisma-rls'

export async function queryTenantRaw<T = unknown>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
  return withTenantRLS(async (tx: any) => tx.$queryRaw(strings as any, ...values))
}

export async function executeTenantRaw(strings: TemplateStringsArray, ...values: any[]): Promise<number | unknown> {
  return withTenantRLS(async (tx: any) => (tx.$executeRaw ? tx.$executeRaw(strings as any, ...values) : tx.$queryRaw(strings as any, ...values)))
}

export async function queryTenantRawAs<T = unknown>(tenantId: string, strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
  return withTenantRLS(async (tx: any) => tx.$queryRaw(strings as any, ...values), tenantId)
}
