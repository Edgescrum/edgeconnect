import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_JP } from "next/font/google";
import { LiffProvider } from "@/components/LiffProvider";
import { NavigationLoader } from "@/components/NavigationLoader";
import { ProfileGate } from "@/components/ProfileGate";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
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
      className={`${dmSans.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="bg-background">
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var nav = performance.getEntriesByType('navigation')[0];
            if (nav && nav.type === 'back_forward') {
              window.location.reload();
            }
          } catch(e) {}
        `}} />
        <NavigationLoader />
        <ProfileGate />
        <LiffProvider>
          {children}
        </LiffProvider>
      </body>
    </html>
  );
}
