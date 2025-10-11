declare const vi: any

type PrismaModelMethod = (...args: any[]) => Promise<any>

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

function createMockMethod(defaultReturn: any): PrismaModelMethod {
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

function ensurePrismaInternals(target: any) {
  if (typeof target.$use !== 'function') {
    target.$use = typeof vi !== 'undefined' && typeof vi.fn === 'function' ? vi.fn() : (() => undefined)
  }
  if (typeof target.$transaction !== 'function') {
    target.$transaction = async (actions: any) => {
      if (typeof actions === 'function') {
        return actions(target)
      }
      if (Array.isArray(actions)) {
        return Promise.all(actions)
      }
      return actions
    }
  }
  if (typeof target.$disconnect !== 'function') {
    target.$disconnect = async () => undefined
  }
}

const mockPrisma: PrismaMock = new Proxy({}, {
  get(target, prop: string) {
    if (!(prop in target)) (target as any)[prop] = createModelMock()
    return (target as any)[prop]
  }
}) as unknown as PrismaMock

ensurePrismaInternals(mockPrisma)

function resetPrismaMock() {
  for (const k of Object.keys(mockPrisma)) {
    ;(mockPrisma as any)[k] = createModelMock()
  }
  ensurePrismaInternals(mockPrisma)
}

function setModelMethod(model: string, method: keyof ModelMock, impl: PrismaModelMethod) {
  if (!(mockPrisma as any)[model]) (mockPrisma as any)[model] = createModelMock()
  ;(mockPrisma as any)[model][method] = impl
}

export { mockPrisma, resetPrismaMock, setModelMethod }
export default mockPrisma
