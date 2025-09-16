import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role?: 'ADMIN' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'CLIENT' | string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role?: 'ADMIN' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'CLIENT' | string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'ADMIN' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'CLIENT' | string
  }
}
