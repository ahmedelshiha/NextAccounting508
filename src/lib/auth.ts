import type { NextAuthOptions, User, Session } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cacheGet, cacheSet } from '@/lib/cache'

const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)

const demoUsers = [
  { id: 'demo-admin', name: 'Admin User', email: 'admin@accountingfirm.com', password: 'admin123', role: 'ADMIN' },
  { id: 'demo-staff', name: 'Staff Member', email: 'staff@accountingfirm.com', password: 'staff123', role: 'STAFF' },
  { id: 'demo-client', name: 'John Smith', email: 'john@example.com', password: 'client123', role: 'CLIENT' },
]

async function getSessionVersion(userId: string): Promise<number> {
  const key = `sv:${userId}`
  const cached = await cacheGet<number>(key)
  if (cached != null) return cached
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { sessionVersion: true } })
  const sv = dbUser?.sessionVersion ?? 0
  await cacheSet(key, sv, 10)
  return sv
}

export const authOptions: NextAuthOptions = {
  ...(hasDb ? { adapter: PrismaAdapter(prisma) } : {}),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        if (!hasDb) {
          const u = demoUsers.find((x) => x.email.toLowerCase() === credentials.email.toLowerCase())
          if (!u) return null
          if (credentials.password !== u.password) return null
          return { id: u.id, email: u.email, name: u.name, role: u.role }
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.password) return null
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image }
      }
    })
  ],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8, updateAge: 60 * 15 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as User).role
        if (hasDb) token.sessionVersion = await getSessionVersion((user as User).id)
        else token.sessionVersion = 0
      } else if (token.sub && hasDb) {
        const sv = await getSessionVersion(token.sub)
        if (token.sessionVersion !== sv) {
          const t = token as unknown as { invalidated?: boolean }
          t.invalidated = true
        }
      }
      return token
    },
    async session({ session, token }) {
      const tok = token as unknown as { invalidated?: boolean }
      if (tok.invalidated) return null as unknown as Session
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: { signIn: '/login' }
}
