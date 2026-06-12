import type { NextAuthConfig } from "next-auth";
import { appBasePath, withBasePath } from "@/lib/base-path";

function stripBasePath(pathname: string) {
  if (!appBasePath) return pathname;
  if (pathname === appBasePath) return "/";
  return pathname.startsWith(`${appBasePath}/`) ? pathname.slice(appBasePath.length) : pathname;
}

// تُستنتج من بروتوكول AUTH_URL: في الإنتاج (https) نستخدم كوكيز آمنة بادئة __Secure-.
const useSecureCookies = (process.env.AUTH_URL ?? "").startsWith("https://");
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

// Lightweight config used in proxy.ts (Edge-compatible, no DB imports)
export const authConfig: NextAuthConfig = {
  // ضروري خلف بروكسي عكسي (Coolify/nginx): يثق بالـ host header
  // حتى تُقرأ/تُكتب جلسة المصادقة بشكل صحيح بعد عودة OAuth من Google.
  trustHost: true,
  // ضبط صريح لكوكيز الجلسة (مكان واحد يرثه الخادم والـ middleware لضمان التطابق):
  // httpOnly يمنع وصول JS، sameSite=lax يسمح بعودة OAuth، secure في الإنتاج فقط.
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  pages: {
    signIn: withBasePath("/login"),
    error: withBasePath("/login"),
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isSystemAdmin = auth?.user?.accountType === "SYSTEM_ADMIN";
      const pathname = stripBasePath(nextUrl.pathname);

      // المستخدم المسجّل لا يحتاج صفحة الدخول/التسجيل — وجّهه للوحة التحكم.
      // يحل حالة TWA حيث تبقى الجلسة موجودة لكن المستخدم عالق في صفحة الدخول.
      if (pathname === "/login" || pathname === "/register") {
        if (isLoggedIn) {
          return Response.redirect(new URL(withBasePath("/dashboard"), nextUrl));
        }
        return true;
      }

      if (pathname.startsWith("/admin")) {
        return isSystemAdmin;
      }
      if (pathname.startsWith("/dashboard")) {
        return isLoggedIn;
      }
      return true;
    },
    // يضمن توجيهاً آمناً بعد المصادقة — أي رابط غامض ينتهي بلوحة التحكم لا بصفحة الدخول.
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // تجاهل الروابط غير الصالحة
      }
      return `${baseUrl}${withBasePath("/dashboard")}`;
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
