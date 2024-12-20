import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/login',
    error: '/error',
  },
  providers: [
    // Add your providers here
  ],
  callbacks: {
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user }) {
      return token
    }
  }
} 