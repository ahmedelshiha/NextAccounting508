// Project-level Prisma mock for tests

type ModelHandler = {
  deleteMany?: (...args: any[]) => Promise<any>
  findFirst?: (...args: any[]) => Promise<any>
  create?: (...args: any[]) => Promise<any>
  upsert?: (...args: any[]) => Promise<any>
  findUnique?: (...args: any[]) => Promise<any>
  update?: (...args: any[]) => Promise<any>
}

const defaultHandler: ModelHandler = {
  deleteMany: async () => ({ count: 0 }),
  findFirst: async () => null,
  create: async (data: any) => data,
  upsert: async (opts: any) => opts.create || opts.update || null,
  findUnique: async () => null,
  update: async (data: any) => data,
}

const mockPrisma: Record<string, ModelHandler> = {
  organizationSettings: { ...defaultHandler },
  bookings: { ...defaultHandler },
  users: { ...defaultHandler },
  // add other model stubs as tests require
}

function resetPrismaMock() {
  // noop for now; keep handlers as-is
}

export default mockPrisma
export { mockPrisma, resetPrismaMock }
