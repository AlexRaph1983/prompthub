import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "test-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "test-client-secret",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // Позволяет работать без жёстко заданного NEXTAUTH_URL за прокси/на кастомном домене
  trustHost: true,
  // Безопасные куки на проде
  useSecureCookies: process.env.NODE_ENV === 'production',
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/ru/auth/signin",
    error: "/ru/auth/error",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  // Временное решение для разработки - разрешаем неавторизованные запросы
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 