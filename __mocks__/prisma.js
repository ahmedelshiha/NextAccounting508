// Simple JS Prisma mock with override helpers for tests
const modelDefaults = {}
const { vi } = (() => {
  try { return require('vitest') } catch { return { vi: undefined } }
})()

function makeFn(fn) {
  if (vi && typeof vi.fn === 'function') return vi.fn(fn)
  // basic fallback mock-like function
  const f = async (...args) => fn(...args)
  f.mockResolvedValueOnce = (v) => { f._next = v }
  const orig = f
  return async (...args) => {
    if (orig._next !== undefined) {
      const v = orig._next
      delete orig._next
      return v
    }
    return fn(...args)
  }
}

function createModel() {
  return {
    deleteMany: makeFn(async () => ({ count: 0 })),
    findMany: makeFn(async () => []),
    findFirst: makeFn(async () => null),
    findUnique: makeFn(async () => null),
    create: makeFn(async (data) => ({ id: String(Math.random()).slice(2), ...data })),
    update: makeFn(async (data) => data),
    upsert: makeFn(async (opts) => opts.create ? ({ id: String(Math.random()).slice(2), ...opts.create }) : (opts.update || null)),
    // Raw helpers (used by some code paths)
    $queryRaw: makeFn(async () => null),
    $executeRaw: makeFn(async () => null),
  }
}

// Initialize commonly used models so tests referencing them directly find mocked methods
const commonModels = ['service','booking','serviceRequest','organizationSettings','availabilitySlot','teamMember','chatMessage','users','membership']
for (const m of commonModels) modelDefaults[m] = createModel()

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
        tx.$queryRaw = makeFn(async () => null)
        tx.$executeRaw = makeFn(async () => null)
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
