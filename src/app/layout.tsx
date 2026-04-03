import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LiffProvider } from "@/components/LiffProvider";
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
  title: "EdgeConnect",
  description: "予約管理プラットフォーム",
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
      <body className="min-h-full flex flex-col bg-[#f8fafc]">
        {/* JS読み込み前に表示されるローディング（hydration後に自動消去） */}
        <div id="initial-loader" style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#f8fafc",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 36, height: 36, margin: "0 auto",
              border: "3px solid #e2e8f0", borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>読み込み中...</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          // LiffProviderがmount後にchildrenを表示 → DOMが変化 → ローダーを消す
          new MutationObserver((_, obs) => {
            var el = document.getElementById('initial-loader');
            if (el && document.body.children.length > 3) {
              el.remove();
              obs.disconnect();
            }
          }).observe(document.body, { childList: true, subtree: true });
          setTimeout(function() { var el = document.getElementById('initial-loader'); if (el) el.remove(); }, 5000);
        `}} />
        <LiffProvider>
          {children}
        </LiffProvider>
      </body>
    </html>
  );
}
