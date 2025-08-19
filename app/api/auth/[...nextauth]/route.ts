import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@/lib/generated/prisma"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const handler = NextAuth({
  // Remove the PrismaAdapter to avoid type incompatibility with next-auth v4
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Find user by username
          const user = await prisma.user.findFirst({
            where: {
              username: credentials.username
            }
          })

          if (!user) {
            return null
          }

          // Compare password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id.toString(),
            username: user.username,
            email: null
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token.username && token.sub) {
        session.user.username = token.username
        session.user.id = token.sub
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET
})

export { handler as GET, handler as POST }
