import { NextResponse } from 'next/server'
import spec from '@/openapi/admin-services.json'

export async function GET() {
  return NextResponse.json(spec)
}
