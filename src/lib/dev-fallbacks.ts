import * as nodeFs from 'node:fs'
import * as nodeOs from 'node:os'
import * as nodePath from 'node:path'

const TMPDIR = process.env.NETLIFY_TEMP_DIR || process.env.TMPDIR || nodeOs.tmpdir()
const FILE = nodePath.resolve(TMPDIR, 'dev-fallbacks.json')

function readData() {
  try {
    if (!nodeFs.existsSync(FILE)) return { requests: {}, comments: {} }
    const raw = nodeFs.readFileSync(FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { requests: {}, comments: {} }
  }
}

function writeData(data: any) {
  try {
    const dir = nodePath.dirname(FILE)
    if (!nodeFs.existsSync(dir)) nodeFs.mkdirSync(dir, { recursive: true })
    nodeFs.writeFileSync(FILE, JSON.stringify(data), 'utf-8')
  } catch {
    // ignore
  }
}

export function getAllRequests() {
  return Object.values(readData().requests)
}

export function getRequest(id: string) {
  return readData().requests[id]
}

export function addRequest(id: string, obj: any) {
  const data = readData()
  data.requests[id] = obj
  writeData(data)
}

export function updateRequest(id: string, patch: any) {
  const data = readData()
  const current = data.requests[id] || null
  if (!current) return null
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
  data.requests[id] = next
  writeData(data)
  return next
}

export function getComments(id: string) {
  return readData().comments[id] || []
}

export function addComment(id: string, comment: any) {
  const data = readData()
  data.comments[id] = data.comments[id] || []
  data.comments[id].push(comment)
  writeData(data)
}
