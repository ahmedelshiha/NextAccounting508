import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

const hasDb = !!process.env.NETLIFY_DATABASE_URL
const DATA_PATH = path.join(process.cwd(), 'src', 'app', 'admin', 'tasks', 'data', 'templates.json')
function readTemplates() {
  try { const raw = fs.readFileSync(DATA_PATH, 'utf-8'); return JSON.parse(raw) } catch { return [] }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    let categories: string[] = []
    if (!hasDb) {
      const templates = readTemplates()
      const set = new Set<string>()
      for (const t of templates) {
        if (t.category) set.add(String(t.category))
      }
      categories = Array.from(set).sort()
      return NextResponse.json({ data: categories })
    }

    // If schema has category, return distinct values; else return []
    try {
      const rows = await prisma.taskTemplate.findMany({ select: { category: true } as any })
      const set = new Set<string>()
      for (const r of rows as any[]) {
        if (r.category) set.add(String(r.category))
      }
      categories = Array.from(set).sort()
    } catch {
      categories = []
    }

    return NextResponse.json({ data: categories })
  } catch (e) {
    console.error('Template categories error', e)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
