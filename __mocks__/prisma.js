// Persistent in-memory Prisma mock for tests
const modelDefaults = {}
const modelStore = {}
let viLib
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  viLib = require('vitest')
} catch (err) {
  viLib = null
}
const vi = viLib ? viLib.vi || viLib : (typeof globalThis !== 'undefined' ? globalThis.vi : undefined)

function makeFn(fn) {
  if (vi && typeof vi.fn === 'function') return vi.fn(fn)
  const f = async (...args) => fn(...args)
  f.mockResolvedValueOnce = (v) => { f._next = v }
  return async (...args) => {
    if (f._next !== undefined) {
      const v = f._next
      delete f._next
      return v
    }
    return fn(...args)
  }
}

function createModel(name) {
  modelStore[name] = modelStore[name] || []

  return {
    deleteMany: makeFn(async ({ where } = {}) => {
      const before = modelStore[name].length
      if (where && where.tenantId) {
        modelStore[name] = modelStore[name].filter((r) => r.tenantId !== where.tenantId)
      } else {
        modelStore[name] = []
      }
      return { count: before - modelStore[name].length }
    }),
    findMany: makeFn(async ({ where } = {}) => {
      if (!where) return modelStore[name]
      return modelStore[name].filter((r) => {
        for (const k of Object.keys(where)) {
          const v = where[k]
          if (v && typeof v === 'object' && v.hasOwnProperty('in')) {
            if (!v.in.includes(r[k])) return false
            continue
          }
          if (r[k] !== v) return false
        }
        return true
      })
    }),
    findFirst: makeFn(async ({ where } = {}) => {
      const list = await (modelDefaults[name].findMany)({ where })
      return list.length ? list[0] : null
    }),
    findUnique: makeFn(async ({ where } = {}) => {
      if (!where || !where.id) return null
      return modelStore[name].find((r) => r.id === where.id) || null
    }),
    create: makeFn(async ({ data } = {}) => {
      const rec = Object.assign({ id: String(Math.random()).slice(2) }, data)
      modelStore[name].push(rec)
      return rec
    }),
    update: makeFn(async ({ where, data } = {}) => {
      const idx = modelStore[name].findIndex((r) => r.id === where.id)
      if (idx === -1) return null
      modelStore[name][idx] = Object.assign({}, modelStore[name][idx], data || {})
      return modelStore[name][idx]
    }),
    upsert: makeFn(async ({ where, create, update } = {}) => {
      const existing = modelStore[name].find((r) => r.id === (where && where.id))
      if (existing) {
        Object.assign(existing, update || {})
        return existing
      }
      const rec = Object.assign({ id: String(Math.random()).slice(2) }, (create || {}))
      modelStore[name].push(rec)
      return rec
    }),
    $queryRaw: makeFn(async () => null),
    $executeRaw: makeFn(async () => null),
  }
}

// Initialize commonly used models
const commonModels = ['service','booking','serviceRequest','organizationSettings','availabilitySlot','teamMember','chatMessage','users','membership']
for (const m of commonModels) modelDefaults[m] = createModel(m)

const mockPrisma = new Proxy({}, {
  get(_, prop) {
    if (prop === '__isMock') return true
    if (prop === '$transaction') {
      return async (fn) => {
        const tx = createModel('__tx')
        tx.$queryRaw = makeFn(async () => null)
        tx.$executeRaw = makeFn(async () => null)
        return fn(tx)
      }
    }
    const name = String(prop)
    if (!(name in modelDefaults)) modelDefaults[name] = createModel(name)
    return modelDefaults[name]
  }
})

function setModelMethod(modelName, methodName, fn) {
  if (!modelDefaults[modelName]) modelDefaults[modelName] = createModel(modelName)
  modelDefaults[modelName][methodName] = fn
  try {
    if (typeof globalThis !== 'undefined' && globalThis.prismaMock) {
      const gm = globalThis.prismaMock
      if (!gm[modelName]) gm[modelName] = createModel(modelName)
      gm[modelName][methodName] = fn
    }
  } catch (err) {}
}

function resetPrismaMock() {
  for (const k of Object.keys(modelDefaults)) delete modelDefaults[k]
  for (const k of Object.keys(modelStore)) delete modelStore[k]
  // reinitialize common models
  for (const m of commonModels) modelDefaults[m] = createModel(m)
}

module.exports = {
  default: mockPrisma,
  mockPrisma: mockPrisma,
  setModelMethod,
  resetPrismaMock,
}
