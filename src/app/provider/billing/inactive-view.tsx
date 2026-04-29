"use client";

import { useState } from "react";
import { Spinner } from "@/components/Spinner";

interface InactiveSubscriptionViewProps {
  plan: string;
  hasCustomer: boolean;
}

export function InactiveSubscriptionView({ plan, hasCustomer }: InactiveSubscriptionViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "standard" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "エラーが発生しました");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-lg space-y-6">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">
            サブスクリプションが無効です
          </h1>
          <p className="mt-2 text-sm text-muted">
            サービスをご利用いただくには、プランへの登録が必要です。
          </p>
        </div>

        {/* 案内カード */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">データは保持されています</p>
              <p className="mt-0.5 text-sm text-muted">
                あなたの予約データやサービスメニューは保持されています。再登録後すぐに利用を再開できます。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">予約ページが非公開になっています</p>
              <p className="mt-0.5 text-sm text-muted">
                お客さまからの新規予約を受け付けられない状態です。再登録すると自動的に公開されます。
              </p>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {/* 再登録ボタン */}
        <button
          onClick={handleResubscribe}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-base font-semibold text-white active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <Spinner size="sm" />
          ) : (
            "プランに登録する"
          )}
        </button>

        {hasCustomer && (
          <p className="text-center text-xs text-muted">
            以前ご利用いただいた決済情報が保存されている場合があります。
          </p>
        )}
      </div>
    </main>
  );
}
