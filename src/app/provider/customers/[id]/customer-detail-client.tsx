"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { saveCustomerNotes } from "@/lib/actions/customer";
import { MonthlyVisitsChart } from "./monthly-visits-chart";

interface CustomerDetail {
  user_id: number;
  display_name: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_bookings: number;
  total_revenue: number;
  avg_price: number;
  first_visit: string | null;
  last_visit: string | null;
  avg_interval_days: number | null;
  churn_risk: number | null;
  days_since_last_visit: number | null;
}

interface Booking {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  cancelled_by: string | null;
  services: { name: string; price: number }[] | { name: string; price: number } | null;
}

interface MonthlyVisit {
  month: string;
  visit_count: number;
}

interface CustomerAverages {
  avg_total_bookings: number;
  avg_total_revenue: number;
  avg_avg_price: number;
  avg_interval_days: number;
  customer_count: number;
}

export function CustomerDetailClient({
  detail,
  monthlyVisits,
  bookings,
  notes,
  customLabels,
  customerUserId,
  customerAverages,
}: {
  detail: CustomerDetail;
  monthlyVisits: MonthlyVisit[];
  bookings: Booking[];
  notes: { memo: string | null; custom_fields: Record<string, string> };
  customLabels: string[];
  customerUserId: number;
  customerAverages?: CustomerAverages | null;
}) {
  const [memo, setMemo] = useState(notes.memo || "");
  const [customFields, setCustomFields] = useState<Record<string, string>>(
    notes.custom_fields || {}
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        await saveCustomerNotes(customerUserId, memo || null, customFields);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        alert("保存に失敗しました");
      }
    });
  }, [customerUserId, memo, customFields]);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    const date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return `${date} ${time}`;
  }

  const name = detail.customer_name || detail.display_name || "不明";
  const isChurnRisk = detail.churn_risk !== null && detail.churn_risk >= 1.5;

  // 利用期間の計算
  let usagePeriod = "-";
  if (detail.first_visit && detail.last_visit) {
    const days = Math.floor(
      (new Date(detail.last_visit).getTime() - new Date(detail.first_visit).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (days >= 365) {
      usagePeriod = `${Math.floor(days / 365)}年${days % 365 > 30 ? Math.floor((days % 365) / 30) + "ヶ月" : ""}`;
    } else if (days >= 30) {
      usagePeriod = `${Math.floor(days / 30)}ヶ月`;
    } else {
      usagePeriod = `${days}日`;
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="hidden sm:block">
        <Link
          href="/provider/customers"
          className="text-sm text-muted hover:text-foreground"
        >
          &larr; 顧客一覧に戻る
        </Link>
      </div>

      {/* プロファイル情報 */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
            {name[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold">{name}</h2>
            {detail.customer_phone && (
              <p className="text-sm text-muted">{detail.customer_phone}</p>
            )}
          </div>
        </div>
      </section>

      {/* KPI指標 */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted">KPI指標</h3>
          {customerAverages && customerAverages.customer_count > 1 && (
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              全{customerAverages.customer_count}名の平均と比較
            </span>
          )}
        </div>
        {isChurnRisk && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="font-medium">
              離脱リスクが高い顧客です（リスク値: {detail.churn_risk}）
            </span>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="累計予約数"
            value={`${detail.total_bookings}回`}
            avg={customerAverages ? `${customerAverages.avg_total_bookings}回` : undefined}
            isAboveAvg={customerAverages ? detail.total_bookings >= customerAverages.avg_total_bookings : undefined}
          />
          <KpiCard
            label="累計売上（LTV）"
            value={`${detail.total_revenue.toLocaleString()}円`}
            avg={customerAverages ? `${customerAverages.avg_total_revenue.toLocaleString()}円` : undefined}
            isAboveAvg={customerAverages ? detail.total_revenue >= customerAverages.avg_total_revenue : undefined}
          />
          <KpiCard
            label="平均単価"
            value={`${Math.round(detail.avg_price).toLocaleString()}円`}
            avg={customerAverages ? `${customerAverages.avg_avg_price.toLocaleString()}円` : undefined}
            isAboveAvg={customerAverages ? detail.avg_price >= customerAverages.avg_avg_price : undefined}
          />
          <KpiCard label="初回来店日" value={formatDate(detail.first_visit)} />
          <KpiCard label="最終来店日" value={formatDate(detail.last_visit)} />
          <KpiCard label="利用期間" value={usagePeriod} />
          <KpiCard
            label="平均来店間隔"
            value={detail.avg_interval_days ? `${detail.avg_interval_days}日` : "-"}
            avg={customerAverages && customerAverages.avg_interval_days > 0 ? `${customerAverages.avg_interval_days}日` : undefined}
            isAboveAvg={
              customerAverages && detail.avg_interval_days !== null && customerAverages.avg_interval_days > 0
                ? detail.avg_interval_days <= customerAverages.avg_interval_days
                : undefined
            }
            invertComparison
          />
          <KpiCard
            label="離脱リスク"
            value={detail.churn_risk !== null ? `${detail.churn_risk}` : "-"}
            alert={isChurnRisk}
          />
        </div>
      </section>

      {/* アンケート指標プレースホルダー */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="text-sm font-semibold text-muted">アンケート指標</h3>
        <p className="mt-3 text-sm text-muted">
          アンケート機能の実装後に表示されます
        </p>
      </section>

      {/* 月別来店頻度 */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="text-sm font-semibold text-muted">月別来店頻度（過去6ヶ月）</h3>
        <div className="mt-4">
          <MonthlyVisitsChart data={monthlyVisits} />
        </div>
      </section>

      {/* 予約履歴 */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="text-sm font-semibold text-muted">予約履歴</h3>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-muted">予約履歴がありません</p>
        ) : (
          <div className="mt-3 space-y-2">
            {bookings.map((b) => {
              const svc = Array.isArray(b.services) ? b.services[0] : b.services;
              return (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl bg-background p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{formatDateTime(b.start_at)}</p>
                  <p className="text-xs text-muted">
                    {svc?.name || "不明"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {svc?.price ? `${svc.price.toLocaleString()}円` : "-"}
                  </p>
                  <span
                    className={`text-xs ${
                      b.status === "confirmed"
                        ? "text-accent"
                        : "text-red-500"
                    }`}
                  >
                    {b.status === "confirmed" ? "確定" : "キャンセル"}
                  </span>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      {/* メモ・カスタム項目 */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="text-sm font-semibold text-muted">メモ</h3>
        <textarea
          value={memo}
          onChange={(e) => {
            setMemo(e.target.value);
            setSaved(false);
          }}
          placeholder="この顧客のメモを入力..."
          rows={4}
          className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-accent/30 resize-none"
        />

        {/* カスタム項目 */}
        {customLabels.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted">カスタム項目</h4>
            {customLabels.map((label) => (
              <div key={label}>
                <label className="mb-1 block text-xs font-medium text-muted">
                  {label}
                </label>
                <input
                  type="text"
                  value={customFields[label] || ""}
                  onChange={(e) => {
                    setCustomFields((prev) => ({
                      ...prev,
                      [label]: e.target.value,
                    }));
                    setSaved(false);
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "保存中..." : "保存"}
          </button>
          {saved && (
            <span className="text-sm text-accent">保存しました</span>
          )}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  alert,
  avg,
  isAboveAvg,
  invertComparison,
}: {
  label: string;
  value: string;
  alert?: boolean;
  avg?: string;
  isAboveAvg?: boolean;
  invertComparison?: boolean;
}) {
  return (
    <div className="rounded-xl bg-background p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold ${alert ? "text-red-500" : ""}`}>
        {value}
      </p>
      {avg !== undefined && (
        <div className="mt-1.5 flex items-center gap-1">
          {isAboveAvg !== undefined && (
            <span
              className={`inline-flex h-4 items-center rounded-sm px-1 text-[10px] font-bold ${
                isAboveAvg
                  ? invertComparison
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-emerald-100 text-emerald-700"
                  : invertComparison
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {isAboveAvg ? (
                invertComparison ? (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                )
              ) : (
                invertComparison ? (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                ) : (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )
              )}
            </span>
          )}
          <span className="text-[10px] text-muted">
            平均: {avg}
          </span>
        </div>
      )}
    </div>
  );
}
