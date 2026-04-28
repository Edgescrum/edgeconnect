"use client";

import { useState, useEffect, useCallback } from "react";
import { Spinner } from "@/components/Spinner";

interface InvoiceItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  invoicePdf: string | null;
}

interface BillingClientProps {
  plan: string;
  planName: string;
  planPrice: number;
  isTrialing: boolean;
  trialDaysLeft: number;
  trialEndDate: string | null;
  planPeriodEnd: string | null;
  hasSubscription: boolean;
  hasCustomer: boolean;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
}

const PLAN_FEATURES: Record<string, string[]> = {
  basic: [
    "予約受付・管理",
    "サービスメニュー登録",
    "営業時間・インターバル設定",
    "プロフィールページ",
    "QRコード・URL発行",
  ],
  standard: [
    "ベーシックの全機能",
    "LINE通知（予約確定・リマインダー）",
    "カレンダー同期",
    "リマインダーカスタマイズ",
    "優先サポート",
  ],
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAmount(amount: number, currency: string): string {
  if (currency === "jpy") {
    return `${amount.toLocaleString()}円`;
  }
  return `${(amount / 100).toLocaleString()}${currency.toUpperCase()}`;
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function statusLabel(status: string): { text: string; className: string } {
  switch (status) {
    case "paid":
      return {
        text: "完了",
        className: "bg-green-50 text-green-700 ring-1 ring-green-200",
      };
    case "open":
      return {
        text: "未払い",
        className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      };
    case "void":
      return {
        text: "無効",
        className: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
      };
    case "uncollectible":
      return {
        text: "回収不能",
        className: "bg-red-50 text-red-700 ring-1 ring-red-200",
      };
    default:
      return {
        text: status,
        className: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
      };
  }
}

/* ============================================================
 * Icons (inline SVG)
 * ========================================================== */

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ============================================================
 * Main Component
 * ========================================================== */

export function BillingClient({
  plan,
  planName,
  planPrice,
  isTrialing,
  trialDaysLeft,
  trialEndDate,
  planPeriodEnd,
  hasSubscription,
  hasCustomer,
  cancelAtPeriodEnd,
  cancelAt,
  paymentMethodBrand,
  paymentMethodLast4,
}: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const periodEndLabel = planPeriodEnd ? formatDateLong(planPeriodEnd) : null;
  const cancelAtLabel = cancelAt ? formatDateLong(cancelAt) : null;
  const trialEndLabel = trialEndDate ? formatDateLong(trialEndDate) : null;
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.basic;

  const planDescription =
    plan === "standard"
      ? "顧客管理・分析・アンケートなど全機能が使えるプラン"
      : "基本的な予約管理機能を備えたプラン";

  const fetchInvoices = useCallback(async () => {
    if (!hasCustomer) return;
    setInvoicesLoading(true);
    try {
      const res = await fetch("/api/stripe/invoices");
      const data = await res.json();
      if (data.invoices) {
        setInvoices(data.invoices);
      }
    } catch {
      // silently fail
    } finally {
      setInvoicesLoading(false);
    }
  }, [hasCustomer]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Error / Success message */}
        {message && (
          <div
            className={`rounded-xl p-4 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                : "bg-red-50 text-red-700 ring-1 ring-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ========== Header Section ========== */}
        <div className="rounded-2xl bg-card p-5 sm:p-6 ring-1 ring-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-bg">
                <StarIcon className="text-accent" />
              </div>
              <div>
                <h1 className="text-lg font-bold sm:text-xl">
                  現在のプラン
                </h1>
                <p className="mt-0.5 text-sm text-muted">
                  あなたのサブスクリプション情報
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                {planName}プラン
              </span>
              {isTrialing && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-200">
                  トライアル中
                </span>
              )}
              {cancelAtPeriodEnd && (
                <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                  解約予約済み
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========== Trial Banner ========== */}
        {isTrialing && (
          <div className="rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-200">
            <div className="flex items-start gap-3">
              <CalendarIcon className="mt-1 shrink-0 text-blue-600" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-blue-700">
                    トライアル期間中
                  </p>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    残り{trialDaysLeft}日
                  </span>
                </div>
                <p className="mt-1 text-sm text-blue-600">
                  {trialEndLabel
                    ? `${trialEndLabel}までスタンダードプランの全機能を無料でお試しいただけます。`
                    : "スタンダードプランの全機能を無料でお試しいただけます。"}
                </p>
                <p className="mt-1 text-xs text-blue-500">
                  トライアル終了後、自動的に
                  {planPrice.toLocaleString()}
                  円/月の課金が開始されます
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========== Cancel Scheduled Banner ========== */}
        {cancelAtPeriodEnd && (
          <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangleIcon className="mt-0.5 shrink-0 text-red-500" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-red-700">
                    解約が予約されています
                  </p>
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                    解約予約済み
                  </span>
                </div>
                {cancelAtLabel && (
                  <div className="mt-2 rounded-lg bg-white/60 px-3 py-2 ring-1 ring-red-100">
                    <p className="text-sm text-red-700">
                      <span className="font-medium">プラン終了日:</span>{" "}
                      <span className="font-bold">{cancelAtLabel}</span>
                    </p>
                  </div>
                )}
                <p className="mt-2 text-sm text-red-600">
                  終了日まではすべての機能を引き続きご利用いただけます。解約をキャンセルする場合は「プラン管理」から操作できます。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========== Plan Info + Features Grid ========== */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Left: Plan Info */}
          <div className="rounded-2xl bg-card p-5 sm:p-6 ring-1 ring-border">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {planName}プラン
                </h2>
                <p className="mt-1 text-sm text-muted">{planDescription}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {planPrice.toLocaleString()}
                </span>
                <span className="text-base text-muted">円/月</span>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                {/* Next billing date */}
                {periodEndLabel && hasSubscription && !cancelAtPeriodEnd && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <CalendarIcon className="shrink-0 text-muted" />
                    <div>
                      <span className="text-muted">次回請求日</span>
                      <p className="font-medium text-foreground">
                        {periodEndLabel}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment method */}
                {paymentMethodBrand && paymentMethodLast4 && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <CreditCardIcon className="shrink-0 text-muted" />
                    <div>
                      <span className="text-muted">お支払い方法</span>
                      <p className="font-medium text-foreground">
                        {capitalizeFirst(paymentMethodBrand)} ****
                        {paymentMethodLast4}
                      </p>
                    </div>
                  </div>
                )}

                {/* Trial info */}
                {isTrialing && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <CalendarIcon className="shrink-0 text-muted" />
                    <div>
                      <span className="text-muted">トライアル終了日</span>
                      <p className="font-medium text-foreground">
                        {trialEndLabel || `残り${trialDaysLeft}日`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cancel end date */}
                {cancelAtPeriodEnd && cancelAtLabel && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <CalendarIcon className="shrink-0 text-red-500" />
                    <div>
                      <span className="text-red-600">プラン終了日</span>
                      <p className="font-semibold text-red-700">
                        {cancelAtLabel}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Plan Features + Manage Button */}
          <div className="rounded-2xl bg-card p-5 sm:p-6 ring-1 ring-border">
            <div className="flex h-full flex-col">
              <h2 className="text-base font-bold text-foreground">
                プラン特典
              </h2>
              <ul className="mt-4 flex-1 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckIcon className="mt-0.5 shrink-0 text-accent" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              {hasCustomer && (
                <div className="mt-6 border-t border-border pt-4">
                  <button
                    onClick={() => handlePortal()}
                    disabled={!!loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading === "portal" ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <ExternalLinkIcon className="text-white" />
                        プラン管理
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== Payment History ========== */}
        {hasCustomer && (
          <div className="rounded-2xl bg-card p-5 sm:p-6 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                支払い履歴
              </h2>
              {!invoicesLoading && invoices.length > 0 && (
                <span className="text-xs text-muted">
                  {invoices.length}件の取引
                </span>
              )}
            </div>

            {invoicesLoading ? (
              <div className="mt-8 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : invoices.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                支払い履歴はまだありません
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                {/* Desktop table */}
                <table className="hidden w-full sm:table">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted">
                      <th className="pb-3 font-medium">請求書ID</th>
                      <th className="pb-3 font-medium">日付</th>
                      <th className="pb-3 font-medium">金額</th>
                      <th className="pb-3 font-medium">説明</th>
                      <th className="pb-3 text-right font-medium">
                        ステータス
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {invoices.map((inv) => {
                      const st = statusLabel(inv.status);
                      return (
                        <tr
                          key={inv.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-3 font-mono text-xs text-muted">
                            {inv.id}
                          </td>
                          <td className="py-3">{formatDate(inv.date)}</td>
                          <td className="py-3 font-medium">
                            {formatAmount(inv.amount, inv.currency)}
                          </td>
                          <td className="py-3 text-muted max-w-[200px] truncate">
                            {inv.description}
                          </td>
                          <td className="py-3 text-right">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}
                            >
                              {st.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile card list */}
                <div className="space-y-3 sm:hidden">
                  {invoices.map((inv) => {
                    const st = statusLabel(inv.status);
                    return (
                      <div
                        key={inv.id}
                        className="rounded-xl border border-border/50 p-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {formatAmount(inv.amount, inv.currency)}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}
                          >
                            {st.text}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted truncate">
                          {inv.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted">
                          <span>{formatDate(inv.date)}</span>
                          <span className="font-mono">{inv.id}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
