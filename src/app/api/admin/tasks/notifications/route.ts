import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const DATA_PATH = path.join(process.cwd(), 'src', 'app', 'admin', 'tasks', 'data', 'notifications.json')

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
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(readSettings())
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const s = { ...readSettings(), ...body, updatedAt: new Date().toISOString() }
    writeSettings(s)
    return NextResponse.json(s)
  } catch (e) {
    console.error('Update notifications error', e)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
