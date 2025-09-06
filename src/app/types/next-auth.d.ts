import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role?: 'ADMIN' | 'STAFF' | 'CLIENT' | string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role?: 'ADMIN' | 'STAFF' | 'CLIENT' | string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'ADMIN' | 'STAFF' | 'CLIENT' | string
  }
}
