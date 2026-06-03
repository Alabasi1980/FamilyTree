import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import type { AccountType } from "@/generated/prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Google,
    CredentialsProvider({
      name: "credentials",
      credentials: {
        emailOrPhone: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrPhone || !credentials?.password) return null;

        const identifier = credentials.emailOrPhone as string;
        const password = credentials.password as string;

        const user = await db.user.findFirst({
          where: {
            OR: [{ email: identifier }, { phone: identifier }],
            deletedAt: null,
          },
          select: {
            id: true,
            fullName: true,
            name: true,
            email: true,
            phone: true,
            accountType: true,
            passwordHash: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.fullName ?? user.name,
          email: user.email ?? user.phone ?? "",
          accountType: user.accountType,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const credentialAccountType = (user as { accountType?: AccountType }).accountType;
        if (credentialAccountType) {
          token.accountType = credentialAccountType;
        } else {
          // OAuth sign-in: fetch accountType from DB
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { accountType: true, email: true },
          });
          // Permanent system admins by email
          const SYSTEM_ADMIN_EMAILS = ["mjd.alabasi@gmail.com"];
          const isPermAdmin = SYSTEM_ADMIN_EMAILS.includes(dbUser?.email ?? "");
          if (isPermAdmin && dbUser?.accountType !== "SYSTEM_ADMIN") {
            await db.user.update({
              where: { id: user.id },
              data: { accountType: "SYSTEM_ADMIN" },
            });
          }
          token.accountType = isPermAdmin ? "SYSTEM_ADMIN" : (dbUser?.accountType ?? "VISITOR");
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.accountType = token.accountType as AccountType;
      }
      return session;
    },
  },
});

