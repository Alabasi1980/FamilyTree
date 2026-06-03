import type { NextAuthConfig } from "next-auth";

// Lightweight config used in proxy.ts (Edge-compatible, no DB imports)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isSystemAdmin = auth?.user?.accountType === "SYSTEM_ADMIN";
      const { pathname } = nextUrl;

      if (pathname.startsWith("/admin")) {
        return isSystemAdmin;
      }
      if (pathname.startsWith("/dashboard")) {
        return isLoggedIn;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accountType = (user as { accountType?: string }).accountType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.accountType = token.accountType as import("@/generated/prisma/client").AccountType;
      }
      return session;
    },
  },
  providers: [],
};
