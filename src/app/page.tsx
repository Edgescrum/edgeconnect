"use client";

import { useLiff } from "@/components/LiffProvider";
import { useEffect, useState } from "react";

interface ProviderInfo {
  slug: string;
  name: string;
}

export default function Home() {
  const { user, isReady, isLoggedIn, error, login } = useLiff();
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !isLoggedIn) {
      setLoading(false);
      return;
    }
    // ログイン済みなら事業主情報を取得
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.provider) setProvider(data.provider);
      })
      .finally(() => setLoading(false));
  }, [isReady, isLoggedIn]);

  // ローディング
  if (!isReady || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm">読み込み中...</span>
        </div>
      </main>
    );
  }

  // 未ログイン
  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">
            E
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">EdgeConnect</h1>
          <p className="mt-2 text-muted">予約受付をもっとシンプルに</p>
          <div className="mt-10 space-y-4">
            <button
              onClick={login}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-base font-semibold text-white shadow-lg shadow-success/25 active:scale-[0.98]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINEでログイン
            </button>
            <p className="text-xs text-muted">LINEアカウントで簡単に始められます</p>
          </div>
        </div>
      </main>
    );
  }

  // ログイン済み + 事業主登録済み → ダッシュボード
  if (provider) {
    const menuItems = [
      {
        href: "/provider/services",
        icon: "📋",
        title: "サービスメニュー",
        desc: "メニューの追加・編集・公開設定",
      },
      {
        href: `/p/${provider.slug}`,
        icon: "👤",
        title: "予約ページ",
        desc: "お客さまに見えるページを確認",
      },
      {
        href: "/provider/qrcode",
        icon: "📱",
        title: "QRコード",
        desc: "お客さまに共有するQRコード",
      },
      {
        href: "/provider/profile",
        icon: "✏️",
        title: "プロフィール編集",
        desc: "名前・紹介文・アイコンを変更",
      },
    ];

    return (
      <main className="min-h-screen bg-background px-4 py-6">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">こんにちは</p>
              <h1 className="text-xl font-bold">{provider.name}</h1>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">
              {provider.name[0]}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted">今日の予約</p>
            </div>
            <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted">今週の予約</p>
            </div>
          </div>

          {/* Menu */}
          <div className="mt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              管理メニュー
            </h2>
            <div className="space-y-2">
              {menuItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted">{item.desc}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="mt-6 rounded-2xl bg-accent-bg p-4">
            <p className="text-xs font-semibold text-accent">💡 ヒント</p>
            <p className="mt-1 text-xs leading-relaxed text-accent">
              サービスメニューを登録するとお客さまの予約ページに表示されます。
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ログイン済み + 未登録 → 登録案内
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">
          E
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">EdgeConnect</h1>
        <p className="mt-2 text-muted">予約受付をもっとシンプルに</p>

        <div className="mt-10 space-y-4">
          <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-bg text-lg font-bold text-accent">
                {user?.displayName?.[0] || "?"}
              </div>
              <div className="text-left">
                <p className="font-semibold">{user?.displayName}</p>
                <p className="text-xs text-muted">ログイン中</p>
              </div>
            </div>
          </div>
          <a
            href="/provider/register"
            className="block w-full rounded-xl bg-accent py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
          >
            事業主として始める
          </a>
          <p className="text-xs text-muted">無料で予約ページを作成できます</p>
        </div>
      </div>
    </main>
  );
}
