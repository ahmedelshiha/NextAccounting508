type ModelMethod = (...args: any[]) => Promise<any>

type ModelMock = {
  findUnique: ModelMethod
  findFirst: ModelMethod
  findMany: ModelMethod
  create: ModelMethod
  createMany: ModelMethod
  update: ModelMethod
  updateMany: ModelMethod
  delete: ModelMethod
  deleteMany: ModelMethod
  upsert: ModelMethod
  count: ModelMethod
  aggregate: ModelMethod
}

type PrismaMock = Record<string, ModelMock>

function createModelMock(): ModelMock {
  // default implementations returning empty/neutral values
  return {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async () => ({}),
    createMany: async () => ({ count: 0 }),
    update: async () => ({}),
    updateMany: async () => ({ count: 0 }),
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
    upsert: async () => ({}),
    count: async () => 0,
    aggregate: async () => ({}),
  }
}

const mockPrisma: PrismaMock = new Proxy({}, {
  get(target, prop: string) {
    if (!target[prop]) target[prop] = createModelMock()
    return target[prop]
  }
}) as unknown as PrismaMock

function resetPrismaMock() {
  for (const k of Object.keys(mockPrisma)) {
    // overwrite each model with a fresh mock
    (mockPrisma as any)[k] = createModelMock()
  }
}

function setModelMethod(model: string, method: keyof ModelMock, impl: ModelMethod) {
  if (!(mockPrisma as any)[model]) (mockPrisma as any)[model] = createModelMock()
  (mockPrisma as any)[model][method] = impl
}

export { mockPrisma, resetPrismaMock, setModelMethod }
export default mockPrisma
