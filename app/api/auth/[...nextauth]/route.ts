import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import TwitterProvider from 'next-auth/providers/twitter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import { hashEmail, generateAnonymousHandle } from '@/lib/auth/crypto'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password are required.')
        }

        const emailHash = hashEmail(credentials.username.toLowerCase())

        const dbUser = await prisma.user.findUnique({
          where: { emailHash }
        })

        if (!dbUser || !dbUser.hashedPassword) {
          throw new Error('Invalid username or password.')
        }

        const isValidPassword = await bcrypt.compare(credentials.password, dbUser.hashedPassword)
        if (!isValidPassword) {
          throw new Error('Invalid username or password.')
        }

        return {
          id: dbUser.emailHash,
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_secret',
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || 'mock_azure_client_id',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || 'mock_azure_secret',
      tenantId: process.env.AZURE_AD_TENANT_ID || 'mock_tenant',
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || 'mock_twitter_id',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || 'mock_twitter_secret',
      version: '2.0',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials') {
        return true
      }
      // 1. Ensure we have some unique identifier for the user (usually email)
      const uniqueId = user.email || account?.providerAccountId

      if (!uniqueId) {
        return false // Reject sign-in if we can't identify the user
      }

      // 2. IMMEDIATELY HASH the identifier. The real email/id is NEVER stored.
      const emailHash = hashEmail(uniqueId.toLowerCase())

      try {
        // 3. Find or create the anonymous User record in our database
        await prisma.user.upsert({
          where: { emailHash },
          update: {},
          create: {
            emailHash,
            anonymousHandle: generateAnonymousHandle(),
          },
        })
        
        // We attach the emailHash to the user object temporarily so it can be passed to jwt/session callbacks
        user.id = emailHash
        
        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return false
      }
    },
    async jwt({ token, user, account }) {
      // If it's the first time signing in, 'user' will be available
      if (user && user.id) {
        // Find the actual database user using the emailHash we stored in user.id
        const dbUser = await prisma.user.findUnique({
          where: { emailHash: user.id },
          select: { id: true, anonymousHandle: true }
        })
        
        if (dbUser) {
          token.uid = dbUser.id
          token.anonymousHandle = dbUser.anonymousHandle
        }
        
        // Clean up any actual personal data from the token just to be safe
        delete token.email
        delete token.name
        delete token.picture
      }
      return token
    },
    async session({ session, token }) {
      if (token?.uid) {
        // Attach the anonymous database user ID and handle to the session
        // NextAuth's default Session type only has name/email/image.
        // We use `as any` here because we extend the session via module augmentation
        // (or rely on the fact that the client SDK uses the raw JSON anyway).
        ;(session.user as any) = {
          id: token.uid as string,
          anonymousHandle: token.anonymousHandle as string,
        }
      }
      
      // Remove default NextAuth email/name/image from the session payload exposed to the client
      if (session.user) {
        delete (session.user as any).name
        delete (session.user as any).email
        delete (session.user as any).image
      }
      
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
