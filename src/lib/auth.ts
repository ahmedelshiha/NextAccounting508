import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const hasDb = Boolean(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL)

// Lightweight fallback demo users when no DB is configured
const demoUsers = [
  { id: 'demo-admin', name: 'Admin User', email: 'admin@accountingfirm.com', password: 'admin123', role: 'ADMIN' },
  { id: 'demo-staff', name: 'Staff Member', email: 'staff@accountingfirm.com', password: 'staff123', role: 'STAFF' },
  { id: 'demo-client', name: 'John Smith', email: 'john@example.com', password: 'client123', role: 'CLIENT' },
]

export const authOptions: NextAuthOptions = {
  // Only attach the Prisma adapter when a DB is available
  ...(hasDb ? { adapter: PrismaAdapter(prisma) } : {}),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: { signIn: '/login' }
}
