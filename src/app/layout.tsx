import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LiffProvider } from "@/components/LiffProvider";
import { NavigationLoader } from "@/components/NavigationLoader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PeCo - LINE予約管理",
    template: "%s | PeCo",
  },
  description:
    "個人事業主のための予約受付・管理プラットフォーム。LINEで予約・通知・スケジュール管理を自動化。",
  openGraph: {
    type: "website",
    siteName: "PeCo",
    title: "PeCo - LINE予約管理",
    description:
      "個人事業主のための予約受付・管理プラットフォーム。LINEで予約・通知・スケジュール管理を自動化。",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-[#f8fafc]">
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var nav = performance.getEntriesByType('navigation')[0];
            if (nav && nav.type === 'back_forward') {
              window.location.reload();
            }
          } catch(e) {}
        `}} />
        <NavigationLoader />
        <LiffProvider>
          {children}
        </LiffProvider>
      </body>
    </html>
  );
}
