import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

// Edge-safe auth config — no Prisma adapter, no Node.js-only deps.
// Used by middleware. Full config (with PrismaAdapter) is in auth.ts.
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isLoginPage = nextUrl.pathname === "/login"

      if (isDashboard && !isLoggedIn) return false // redirects to signIn page
      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
  },
} satisfies NextAuthConfig
