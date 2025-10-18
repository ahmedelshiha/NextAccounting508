// Simple JS Prisma mock with override helpers for tests
const modelDefaults = {}

function createModel() {
  return {
    deleteMany: async () => ({ count: 0 }),
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (data) => data,
    update: async (data) => data,
    upsert: async (opts) => opts.create || opts.update || null,
  }
}

const mockPrisma = new Proxy({}, {
  get(_, prop) {
    if (prop === '__isMock') return true
    if (!(prop in modelDefaults)) modelDefaults[prop] = createModel()
    return modelDefaults[prop]
  }
})

function setModelMethod(modelName, methodName, fn) {
  if (!modelDefaults[modelName]) modelDefaults[modelName] = createModel()
  modelDefaults[modelName][methodName] = fn
}

function resetPrismaMock() {
  for (const k of Object.keys(modelDefaults)) delete modelDefaults[k]
}

module.exports = {
  default: mockPrisma,
  mockPrisma: mockPrisma,
  setModelMethod,
  resetPrismaMock,
}
