import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-compatible auth proxy — uses JWT only, no database calls
const { auth } = NextAuth(authConfig);

export { auth as proxy };

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
