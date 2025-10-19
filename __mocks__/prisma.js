// Simple JS Prisma mock with override helpers for tests
const modelDefaults = {}

function createModel() {
  return {
    deleteMany: async () => ({ count: 0 }),
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (data) => ({ id: String(Math.random()).slice(2), ...data }),
    update: async (data) => data,
    upsert: async (opts) => opts.create ? ({ id: String(Math.random()).slice(2), ...opts.create }) : (opts.update || null),
    // Raw helpers (used by some code paths)
    $queryRaw: async () => null,
    $executeRaw: async () => null,
  }
}

// Provide a top-level mockPrisma object that returns model proxies and also
// exposes $transaction so code using getPrisma().$transaction(...) works.
const mockPrisma = new Proxy({}, {
  get(_, prop) {
    if (prop === '__isMock') return true
    // Provide $transaction function which executes fn with a tx object
    if (prop === '$transaction') {
      return async (fn) => {
        const tx = createModel()
        // add tx.$queryRaw and $executeRaw implementations
        tx.$queryRaw = async () => null
        tx.$executeRaw = async () => null
        return fn(tx)
      }
    }

    if (!(prop in modelDefaults)) modelDefaults[prop] = createModel()
    return modelDefaults[prop]
  }
})

function setModelMethod(modelName, methodName, fn) {
  if (!modelDefaults[modelName]) modelDefaults[modelName] = createModel()
  modelDefaults[modelName][methodName] = fn
  try {
    if (typeof globalThis !== 'undefined' && (globalThis).prismaMock) {
      const gm = (globalThis).prismaMock
      if (!gm[modelName]) gm[modelName] = createModel()
      gm[modelName][methodName] = fn
    }
  } catch (err) {
    // ignore
  }
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
