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
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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

  async function handleUpgrade() {
    setLoading("upgrade");
    setMessage(null);
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
      setMessage({ type: "error", text: data.error || "エラーが発生しました" });
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setLoading(null);
    }
  }

  async function handleDowngrade() {
    setLoading("downgrade");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "basic" }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: "success",
          text: "現在の請求期間末でベーシックプランに変更されます",
        });
        setShowDowngradeModal(false);
      } else {
        setMessage({
          type: "error",
          text: data.error || "プラン変更に失敗しました",
        });
      }
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    setLoading("cancel");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: "success",
          text: "現在の請求期間末でプランが解約されます",
        });
        setShowCancelModal(false);
      } else {
        setMessage({
          type: "error",
          text: data.error || "解約に失敗しました",
        });
      }
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMessage({ type: "error", text: data.error || "エラーが発生しました" });
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

        {/* 現在のプランカード */}
        <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">現在のプラン</p>
              <p className="mt-1 text-2xl font-bold">{planName}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {planPrice.toLocaleString()}
                <span className="text-sm font-normal text-muted">円/月</span>
              </p>
            </div>
          </div>

          {/* トライアル表示 */}
          {isTrialing && (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
              <p className="text-sm font-medium text-amber-700">
                トライアル期間中 -- 残り{trialDaysLeft}日
              </p>
              <p className="mt-0.5 text-xs text-amber-600">
                トライアル終了後、自動的に{planPrice.toLocaleString()}
                円/月の課金が開始されます
              </p>
            </div>
          )}

          {/* トライアル中のプラン選択セクション */}
          {isTrialing && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground">トライアル終了後のプラン</h3>
              <p className="mt-1 text-xs text-muted">
                何もしなければ、トライアル終了後にスタンダード（980円/月）の課金が自動的に開始されます。
              </p>
              <div className="mt-4 space-y-3">
                {/* スタンダード継続 */}
                <div className="rounded-xl border-2 border-accent bg-accent/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-accent bg-accent">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">スタンダードを継続する</p>
                        <p className="text-xs text-muted">980円/月</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-white">
                      現在の選択
                    </span>
                  </div>
                </div>

                {/* ベーシックにダウングレード */}
                <button
                  onClick={() => setShowDowngradeModal(true)}
                  disabled={!!loading}
                  className="w-full rounded-xl border border-border bg-card p-4 text-left active:scale-[0.99] disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-border" />
                    <div>
                      <p className="text-sm font-semibold">ベーシックにダウングレード</p>
                      <p className="text-xs text-muted">500円/月</p>
                    </div>
                  </div>
                </button>

                {/* 解約 */}
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={!!loading}
                  className="w-full rounded-xl p-3 text-center text-sm text-red-500 hover:bg-red-50 active:scale-[0.99] disabled:opacity-50"
                >
                  解約する
                </button>
              </div>
            </div>
          )}

          {/* 次回請求日 */}
          {periodEndLabel && hasSubscription && (
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
        </div>

        {/* プラン変更セクション */}
        <div className="mt-6 space-y-3">
          {/* アップグレード（ベーシックの場合のみ） */}
          {isBasic && hasSubscription && (
            <button
              onClick={handleUpgrade}
              disabled={!!loading}
              className="flex w-full items-center justify-between rounded-2xl bg-accent p-5 text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              <div className="text-left">
                <p className="font-semibold">
                  スタンダードにアップグレード
                </p>
                <p className="mt-0.5 text-sm text-white/80">
                  顧客管理・分析・アンケート機能が使えます
                </p>
              </div>
              <div className="flex items-center gap-2">
                {loading === "upgrade" ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <span className="text-lg font-bold">980円/月</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </>
                )}
              </div>
            </button>
          )}

          {/* アップグレード（サブスクなしの場合） */}
          {isBasic && !hasSubscription && (
            <button
              onClick={handleUpgrade}
              disabled={!!loading}
              className="flex w-full items-center justify-between rounded-2xl bg-accent p-5 text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              <div className="text-left">
                <p className="font-semibold">
                  有料プランに申し込む
                </p>
                <p className="mt-0.5 text-sm text-white/80">
                  スタンダード: 顧客管理・分析・アンケート
                </p>
              </div>
              <div className="flex items-center gap-2">
                {loading === "upgrade" ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <span className="text-lg font-bold">980円/月</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </>
                )}
              </div>
            </button>
          )}

          {/* ダウングレード（スタンダードの場合のみ、トライアル中は専用セクションで表示） */}
          {isStandard && hasSubscription && !isTrialing && (
            <button
              onClick={() => setShowDowngradeModal(true)}
              disabled={!!loading}
              className="flex w-full items-center justify-between rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border active:scale-[0.99] disabled:opacity-50"
            >
              <div className="text-left">
                <p className="font-semibold text-foreground">
                  ベーシックにダウングレード
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  現在の請求期間末で変更されます
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}

          {/* 解約（トライアル中は専用セクションで表示） */}
          {hasSubscription && !isTrialing && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={!!loading}
              className="w-full rounded-2xl p-4 text-center text-sm text-red-500 hover:bg-red-50 active:scale-[0.99] disabled:opacity-50"
            >
              プランを解約する
            </button>
          )}
        </div>

        {/* Stripeカスタマーポータル */}
        {hasCustomer && (
          <div className="mt-8 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <h2 className="font-semibold">お支払い情報</h2>
            <p className="mt-1 text-sm text-muted">
              支払い履歴の確認やカード情報の変更はこちらから
            </p>
            <button
              onClick={handlePortal}
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
                  支払い情報を管理する
                </>
              )}
            </button>
          </div>
        )}

        {/* プラン比較 */}
        <div className="mt-8">
          <h2 className="mb-4 font-semibold">プラン比較</h2>
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
            />
          </div>
        </div>
      </div>

      {/* ダウングレード確認モーダル */}
      {showDowngradeModal && (
        <Modal onClose={() => setShowDowngradeModal(false)}>
          <h3 className="text-lg font-bold">ダウングレードの確認</h3>
          <p className="mt-3 text-sm text-muted">
            ベーシックプラン（500円/月）に変更します。
          </p>
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
            <p className="font-medium">注意:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs">
              {isTrialing ? (
                <>
                  <li>トライアル終了後、ベーシックプランの課金（500円/月）が開始されます</li>
                  <li>顧客管理・分析・アンケート機能は利用できなくなります</li>
                  <li>3ヶ月以内にスタンダードに戻せばデータは復活します</li>
                </>
              ) : (
                <>
                  <li>
                    変更は現在の請求期間末({periodEndLabel || "次の請求日"})に反映されます
                  </li>
                  <li>
                    それまでスタンダード機能は引き続きご利用いただけます
                  </li>
                  <li>
                    ダウングレード後3ヶ月以内に再アップグレードすればデータは復活します
                  </li>
                </>
              )}
            </ul>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowDowngradeModal(false)}
              className="flex-1 rounded-xl bg-background px-4 py-2.5 text-sm font-medium ring-1 ring-border"
            >
              キャンセル
            </button>
            <button
              onClick={handleDowngrade}
              disabled={!!loading}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading === "downgrade" ? (
                <Spinner size="sm" />
              ) : (
                "ダウングレードする"
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* 解約確認モーダル */}
      {showCancelModal && (
        <Modal onClose={() => setShowCancelModal(false)}>
          <h3 className="text-lg font-bold">プラン解約の確認</h3>
          <p className="mt-3 text-sm text-muted">
            プランを解約します。
          </p>
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">注意:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs">
              {isTrialing ? (
                <>
                  <li>トライアル終了時点でサービスが停止されます</li>
                  <li>予約受付・管理を含む全機能が利用できなくなります</li>
                  <li>3ヶ月以内に再申し込みでデータは復活します</li>
                </>
              ) : (
                <>
                  <li>
                    {periodEndLabel
                      ? `${periodEndLabel}まで現プランの機能をご利用いただけます`
                      : "現在の請求期間末まで現プランの機能をご利用いただけます"}
                  </li>
                  <li>解約後もベーシック機能は引き続きご利用いただけます</li>
                  <li>3ヶ月以内に再申し込みでデータは復活します</li>
                </>
              )}
            </ul>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowCancelModal(false)}
              className="flex-1 rounded-xl bg-background px-4 py-2.5 text-sm font-medium ring-1 ring-border"
            >
              キャンセル
            </button>
            <button
              onClick={handleCancel}
              disabled={!!loading}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading === "cancel" ? (
                <Spinner size="sm" />
              ) : (
                "解約する"
              )}
            </button>
          </div>
        </Modal>
      )}
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
}: {
  name: string;
  price: number;
  features: string[];
  isCurrent: boolean;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ring-1 ${
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
      <ul className="mt-4 space-y-2">
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
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}
