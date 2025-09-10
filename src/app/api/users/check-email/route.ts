import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.toLowerCase().trim()
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const hasDb = !!process.env.NETLIFY_DATABASE_URL
    if (!hasDb) {
      return NextResponse.json({ exists: false })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    return NextResponse.json({ exists: !!user })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
