import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'temp', 'task management', 'data', 'notifications.json')

function readSettings() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return { emailEnabled: false, emailFrom: '', webhookUrl: '', templates: [] }
  }
}

function writeSettings(s: any) {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
    fs.writeFileSync(DATA_PATH, JSON.stringify(s, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error('Failed to write notifications', e)
    return false
  }
}

export async function GET() {
  return NextResponse.json(readSettings())
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const s = { ...readSettings(), ...body, updatedAt: new Date().toISOString() }
    writeSettings(s)
    return NextResponse.json(s)
  } catch (e) {
    console.error('Update notifications error', e)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
