import 'next/server'
import type { Session } from 'next-auth'

declare module 'next/server' {
  interface NextRequest {
    nextauth?: { token?: unknown; session?: Session | null }
  }
}
