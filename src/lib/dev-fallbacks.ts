import fs from 'fs'
import path from 'path'

const FILE = path.resolve(process.cwd(), 'temp', 'dev-fallbacks.json')

function readData() {
  try {
    if (!fs.existsSync(FILE)) return { requests: {}, comments: {} }
    const raw = fs.readFileSync(FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { requests: {}, comments: {} }
  }
}

function writeData(data: any) {
  try {
    const dir = path.dirname(FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify(data), 'utf-8')
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
