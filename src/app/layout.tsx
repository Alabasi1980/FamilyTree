import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";
import { AuthClientProvider } from "@/components/auth/auth-client-provider";
import { PWARegister } from "@/components/pwa-register";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بستان الأصول",
  description: "منصة لتسجيل وعرض أشجار العائلات وربطها ببعضها",
  keywords: ["شجرة العائلة", "نسب", "عائلة", "أنساب"],
  manifest: withBasePath("/manifest.webmanifest"),
};

export const viewport: Viewport = {
  themeColor: "#0f1a14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn(ibmPlexArabic.variable, "h-full")}
    >
      <body className="min-h-full flex flex-col antialiased">
        <AuthClientProvider>
          {children}
          <PWARegister />
        </AuthClientProvider>
      </body>
    </html>
  );
}
