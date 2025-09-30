import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  export interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id?: string
      role?: string
    }
  }

  // Allow getServerSession to be treated as returning any for current codebase convenience
  export function getServerSession(...args: any[]): Promise<any>
}

declare module 'next-auth/next' {
  export function getServerSession(...args: any[]): Promise<any>
}
