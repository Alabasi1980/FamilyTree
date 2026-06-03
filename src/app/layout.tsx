import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "حديقة العائلات",
  description: "منصة لتسجيل وعرض أشجار العائلات وربطها ببعضها",
  keywords: ["شجرة العائلة", "نسب", "عائلة", "أنساب"],
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
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
