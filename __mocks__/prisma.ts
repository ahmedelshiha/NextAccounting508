type PrismaModelMethod = (...args: any[]) => Promise<any>

declare const vi: any

type PrismaPrismaModelMethod = any

type ModelMock = {
  findUnique: PrismaModelMethod
  findFirst: PrismaModelMethod
  findMany: PrismaModelMethod
  create: PrismaModelMethod
  createMany: PrismaModelMethod
  update: PrismaModelMethod
  updateMany: PrismaModelMethod
  delete: PrismaModelMethod
  deleteMany: PrismaModelMethod
  upsert: PrismaModelMethod
  count: PrismaModelMethod
  aggregate: PrismaModelMethod
}

type PrismaMock = Record<string, ModelMock>

function createMockMethod(defaultReturn: any) {
  // Support vitest's vi.fn mock in test environment, otherwise provide a compatible function
  if (typeof vi !== 'undefined' && typeof vi.fn === 'function') {
    return vi.fn(async () => defaultReturn)
  }

  let onceQueue: any[] = []
  let resolved: any = undefined

  const fn: any = async (..._args: any[]) => {
    if (onceQueue.length) return onceQueue.shift()
    if (resolved !== undefined) return resolved
    return defaultReturn
  }

  fn.mockResolvedValue = (v: any) => { resolved = v; return fn }
  fn.mockResolvedValueOnce = (v: any) => { onceQueue.push(v); return fn }
  fn.mockResolvedValueOnceReset = () => { onceQueue = [] }

  return fn
}

function createModelMock(): ModelMock {
  return {
    findUnique: createMockMethod(null),
    findFirst: createMockMethod(null),
    findMany: createMockMethod([]),
    create: createMockMethod({}),
    createMany: createMockMethod({ count: 0 }),
    update: createMockMethod({}),
    updateMany: createMockMethod({ count: 0 }),
    delete: createMockMethod({}),
    deleteMany: createMockMethod({ count: 0 }),
    upsert: createMockMethod({}),
    count: createMockMethod(0),
    aggregate: createMockMethod({}),
  }
}

const mockPrisma: PrismaMock = new Proxy({}, {
  get(target, prop: string) {
    if (!(prop in target)) (target as any)[prop] = createModelMock()
    return (target as any)[prop]
  }
}) as unknown as PrismaMock

function resetPrismaMock() {
  for (const k of Object.keys(mockPrisma)) {
    ;(mockPrisma as any)[k] = createModelMock()
  }
}

function setPrismaModelMethod(model: string, method: keyof ModelMock, impl: PrismaModelMethod) {
  if (!(mockPrisma as any)[model]) (mockPrisma as any)[model] = createModelMock()
  ;(mockPrisma as any)[model][method] = impl
}

export { mockPrisma, resetPrismaMock, setPrismaModelMethod }
export default mockPrisma
