"use client";

import { useState } from "react";
import { Spinner } from "@/components/Spinner";

interface BillingClientProps {
  plan: string;
  planName: string;
  planPrice: number;
  isTrialing: boolean;
  trialDaysLeft: number;
  planPeriodEnd: string | null;
  hasSubscription: boolean;
  hasCustomer: boolean;
}

export function BillingClient({
  plan,
  planName,
  planPrice,
  isTrialing,
  trialDaysLeft,
  planPeriodEnd,
  hasSubscription,
  hasCustomer,
}: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isBasic = plan === "basic";
  const isStandard = plan === "standard";

  const periodEndLabel = planPeriodEnd
    ? new Date(planPeriodEnd).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  async function handlePortal(flow?: string) {
    const key = flow || "portal";
    setLoading(key);
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMessage({
        type: "error",
        text: data.error || "エラーが発生しました",
      });
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setLoading(null);
    }
  }

  async function handleUpgrade() {
    setLoading("upgrade");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "standard", context: "billing" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMessage({
        type: "error",
        text:
          data.error ||
          "決済セッションの作成に失敗しました。しばらくしてから再度お試しください。",
      });
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-bold sm:text-2xl">プラン管理</h1>
        <p className="mt-1 text-sm text-muted">
          現在のプランの確認・変更ができます
        </p>

        {/* メッセージ */}
        {message && (
          <div
            className={`mt-4 rounded-xl p-4 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                : "bg-red-50 text-red-700 ring-1 ring-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* トライアル表示 */}
        {isTrialing && (
          <div className="mt-6 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
            <p className="font-semibold text-amber-700">
              トライアル期間中 -- 残り{trialDaysLeft}日
            </p>
            <p className="mt-1 text-sm text-amber-600">
              トライアル終了後、自動的に{planPrice.toLocaleString()}
              円/月の課金が開始されます
            </p>
          </div>
        )}

        {/* 次回請求日 */}
        {periodEndLabel && hasSubscription && !isTrialing && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>次回請求日: {periodEndLabel}</span>
          </div>
        )}

        {/* プラン比較 */}
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PlanCard
              name="ベーシック"
              price={500}
              features={[
                "予約管理",
                "サービスメニュー管理",
                "プロフィールページ",
                "QRコード発行",
                "カレンダー連携",
              ]}
              isCurrent={isBasic}
              actionButton={
                isBasic ? (
                  <div className="text-center text-sm font-medium text-muted">
                    現在ご利用中
                  </div>
                ) : hasSubscription ? (
                  <button
                    onClick={() => handlePortal("subscription_update")}
                    disabled={!!loading}
                    className="w-full rounded-xl bg-background py-2.5 text-sm font-medium ring-1 ring-border hover:bg-accent-bg active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading === "subscription_update" ? (
                      <Spinner size="sm" />
                    ) : (
                      "ベーシックに変更する"
                    )}
                  </button>
                ) : undefined
              }
            />
            <PlanCard
              name="スタンダード"
              price={980}
              features={[
                "ベーシックの全機能",
                "顧客管理",
                "予約分析",
                "アンケート・口コミ",
                "通知テンプレート",
                "初回1ヶ月無料トライアル",
              ]}
              isCurrent={isStandard}
              highlighted
              actionButton={
                isStandard ? (
                  <div className="text-center text-sm font-medium text-muted">
                    現在ご利用中
                  </div>
                ) : hasSubscription ? (
                  <button
                    onClick={() => handlePortal("subscription_update")}
                    disabled={!!loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading === "subscription_update" ? (
                      <Spinner size="sm" />
                    ) : (
                      "スタンダードにアップグレード"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={!!loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading === "upgrade" ? (
                      <Spinner size="sm" />
                    ) : (
                      "スタンダードにアップグレード"
                    )}
                  </button>
                )
              }
            />
          </div>
        </div>

        {/* Stripeカスタマーポータル */}
        {hasCustomer && (
          <div className="mt-8 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <h2 className="font-semibold">契約・お支払い管理</h2>
            <p className="mt-1 text-sm text-muted">
              プラン変更・解約・お支払い方法の更新・請求書の確認はこちらから
            </p>
            <button
              onClick={() => handlePortal()}
              disabled={!!loading}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-sm font-medium ring-1 ring-border hover:bg-accent-bg active:scale-[0.99] disabled:opacity-50"
            >
              {loading === "portal" ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  契約・お支払いを管理する
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/* --- サブコンポーネント --- */

function PlanCard({
  name,
  price,
  features,
  isCurrent,
  highlighted,
  actionButton,
}: {
  name: string;
  price: number;
  features: string[];
  isCurrent: boolean;
  highlighted?: boolean;
  actionButton?: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl p-5 ring-1 ${
        highlighted
          ? "bg-accent/5 ring-accent/30"
          : "bg-card ring-border"
      } ${isCurrent ? "ring-2 ring-accent" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">{name}</p>
        {isCurrent && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
            現在のプラン
          </span>
        )}
      </div>
      <p className="mt-2">
        <span className="text-2xl font-bold">{price.toLocaleString()}</span>
        <span className="text-sm text-muted">円/月</span>
      </p>
      <ul className="mt-4 flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mt-0.5 shrink-0 text-accent"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {actionButton && (
        <div className="mt-4 pt-2 border-t border-border">
          {actionButton}
        </div>
      )}
    </div>
  );
}
