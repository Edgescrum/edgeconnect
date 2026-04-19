import { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "EdgeConnectとは",
  description:
    "個人事業主のための予約受付・管理プラットフォーム。LINEで予約・通知・スケジュール管理を自動化。無料で始められます。",
  openGraph: {
    title: "EdgeConnect - LINE予約管理",
    description:
      "個人事業主のための予約受付・管理プラットフォーム。LINEで予約・通知・スケジュール管理を自動化。",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
};

export default function AboutPage() {
  return <LandingPage />;
}
