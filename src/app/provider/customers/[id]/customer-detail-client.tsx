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

interface MenuBreakdown {
  service_id: number;
  service_name: string;
  booking_count: number;
  total_revenue: number;
}

const ITEMS_PER_PAGE = 10;

// 色のパレット（メニュー内訳のグラフ用）
const MENU_COLORS = [
  { bg: "bg-accent", text: "text-accent", ring: "ring-accent/20", hex: "var(--accent)" },
  { bg: "bg-indigo-500", text: "text-indigo-500", ring: "ring-indigo-500/20", hex: "#6366f1" },
  { bg: "bg-emerald-500", text: "text-emerald-500", ring: "ring-emerald-500/20", hex: "#10b981" },
  { bg: "bg-amber-500", text: "text-amber-500", ring: "ring-amber-500/20", hex: "#f59e0b" },
  { bg: "bg-rose-500", text: "text-rose-500", ring: "ring-rose-500/20", hex: "#f43f5e" },
  { bg: "bg-cyan-500", text: "text-cyan-500", ring: "ring-cyan-500/20", hex: "#06b6d4" },
  { bg: "bg-purple-500", text: "text-purple-500", ring: "ring-purple-500/20", hex: "#a855f7" },
  { bg: "bg-pink-500", text: "text-pink-500", ring: "ring-pink-500/20", hex: "#ec4899" },
];

export function CustomerDetailClient({
  detail,
  monthlyVisits,
  bookings,
  notes,
  customLabels,
  customerUserId,
  customerAverages,
  menuBreakdown,
}: {
  detail: CustomerDetail;
  monthlyVisits: MonthlyVisit[];
  bookings: Booking[];
  notes: { memo: string | null; custom_fields: Record<string, string> };
  customLabels: string[];
  customerUserId: number;
  customerAverages?: CustomerAverages | null;
  menuBreakdown: MenuBreakdown[];
}) {
  const [memo, setMemo] = useState(notes.memo || "");
  const [customFields, setCustomFields] = useState<Record<string, string>>(
    notes.custom_fields || {}
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  // 離脱リスクの評価
  const getChurnStatus = () => {
    const daysSince = detail.days_since_last_visit;
    const avgInterval = detail.avg_interval_days;
    const churnRisk = detail.churn_risk;

    if (daysSince === null || avgInterval === null || avgInterval === 0) {
      if (detail.total_bookings === 1 && daysSince !== null) {
        if (daysSince <= 30) return { level: "new", label: "新規顧客", color: "text-blue-600", bgColor: "bg-blue-50", ringColor: "ring-blue-200", icon: "star" };
        if (daysSince <= 60) return { level: "watching", label: "様子見", color: "text-amber-600", bgColor: "bg-amber-50", ringColor: "ring-amber-200", icon: "eye" };
        return { level: "risk", label: "離脱リスク", color: "text-red-600", bgColor: "bg-red-50", ringColor: "ring-red-200", icon: "alert" };
      }
      return { level: "unknown", label: "-", color: "text-muted", bgColor: "bg-background", ringColor: "ring-border", icon: "minus" };
    }

    if (churnRisk !== null && churnRisk < 1.0) {
      return { level: "stable", label: "安定", color: "text-emerald-600", bgColor: "bg-emerald-50", ringColor: "ring-emerald-200", icon: "check" };
    }
    if (churnRisk !== null && churnRisk < 1.5) {
      return { level: "watching", label: "注意", color: "text-amber-600", bgColor: "bg-amber-50", ringColor: "ring-amber-200", icon: "eye" };
    }
    return { level: "risk", label: "離脱リスク", color: "text-red-600", bgColor: "bg-red-50", ringColor: "ring-red-200", icon: "alert" };
  };

  const churnStatus = getChurnStatus();

  // 予約を過去と未来に分割
  const now = new Date();
  const futureBookings = bookings
    .filter((b) => new Date(b.start_at) > now && b.status === "confirmed")
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const pastBookings = bookings
    .filter((b) => new Date(b.start_at) <= now)
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  // ページネーション（過去の予約のみ）
  const totalPages = Math.ceil(pastBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = pastBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const showPagination = pastBookings.length > ITEMS_PER_PAGE;

  // メニュー内訳の合計
  const totalMenuBookings = menuBreakdown.reduce((s, m) => s + m.booking_count, 0);
  const totalMenuRevenue = menuBreakdown.reduce((s, m) => s + m.total_revenue, 0);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="hidden sm:block">
        <Link
          href="/provider/customers"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          顧客一覧に戻る
        </Link>
      </div>

      {/* プロファイル + ステータスバッジ */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 text-2xl font-bold text-accent">
              {name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold">{name}</h2>
              {detail.customer_phone && (
                <p className="mt-0.5 text-sm text-muted">{detail.customer_phone}</p>
              )}
              <p className="mt-1 text-xs text-muted">
                初回来店: {formatDate(detail.first_visit)}
              </p>
            </div>
          </div>
          {/* 離脱リスクバッジ */}
          {churnStatus.level !== "unknown" && (
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${churnStatus.bgColor} ${churnStatus.color} ${churnStatus.ringColor}`}>
              {churnStatus.icon === "check" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {churnStatus.icon === "eye" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
              {churnStatus.icon === "alert" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
              {churnStatus.icon === "star" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
              {churnStatus.label}
            </div>
          )}
        </div>

        {/* 離脱リスクの詳細説明 */}
        {detail.days_since_last_visit !== null && detail.days_since_last_visit >= 0 && (
          <div className={`mt-4 rounded-xl p-3 text-sm ${churnStatus.bgColor}`}>
            <div className="flex items-center justify-between">
              <span className="text-muted">前回来店からの経過</span>
              <span className="font-bold text-foreground">{Math.max(0, detail.days_since_last_visit)}日前</span>
            </div>
            {detail.avg_interval_days !== null && detail.avg_interval_days > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>平均来店間隔: {detail.avg_interval_days}日</span>
                  <span className={`font-semibold ${churnStatus.color}`}>
                    {churnStatus.label}
                  </span>
                </div>
                {/* プログレスバー */}
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      churnStatus.level === "stable" ? "bg-emerald-500" :
                      churnStatus.level === "watching" ? "bg-amber-500" :
                      "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (detail.days_since_last_visit / (detail.avg_interval_days * 2)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted">
                  <span>0日</span>
                  <span className="font-medium">{detail.avg_interval_days}日</span>
                  <span>{detail.avg_interval_days * 2}日</span>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* KPI カード - 重要指標のみ */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          label="来店回数"
          value={`${detail.total_bookings}回`}
          avg={customerAverages ? `${customerAverages.avg_total_bookings}回` : undefined}
          isAboveAvg={customerAverages ? detail.total_bookings >= customerAverages.avg_total_bookings : undefined}
        />
        <KpiCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          label="累計利用金額"
          value={`${detail.total_revenue.toLocaleString()}円`}
          avg={customerAverages ? `${customerAverages.avg_total_revenue.toLocaleString()}円` : undefined}
          isAboveAvg={customerAverages ? detail.total_revenue >= customerAverages.avg_total_revenue : undefined}
        />
        <KpiCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          }
          label="平均単価"
          value={`${Math.round(detail.avg_price).toLocaleString()}円`}
          avg={customerAverages ? `${customerAverages.avg_avg_price.toLocaleString()}円` : undefined}
          isAboveAvg={customerAverages ? detail.avg_price >= customerAverages.avg_avg_price : undefined}
        />
        <KpiCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
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
      </section>

      {/* 利用メニュー内訳 */}
      {menuBreakdown.length > 0 && (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <h3 className="text-sm font-semibold text-foreground">利用メニュー内訳</h3>
          </div>

          {/* ドーナツチャート風の表現 */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* 視覚的な円グラフ (CSS) */}
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="12" opacity="0.3" />
                {menuBreakdown.reduce<{ offset: number; elements: React.ReactNode[] }>((acc, menu, i) => {
                  const pct = totalMenuBookings > 0 ? (menu.booking_count / totalMenuBookings) * 100 : 0;
                  const circumference = 2 * Math.PI * 40;
                  const dashLength = (pct / 100) * circumference;
                  const gap = menuBreakdown.length > 1 ? 2 : 0;
                  const color = MENU_COLORS[i % MENU_COLORS.length];
                  acc.elements.push(
                    <circle
                      key={menu.service_id}
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={color.hex}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.max(0, dashLength - gap)} ${circumference - Math.max(0, dashLength - gap)}`}
                      strokeDashoffset={-acc.offset}
                      className="transition-all duration-700"
                    />
                  );
                  acc.offset += dashLength;
                  return acc;
                }, { offset: 0, elements: [] }).elements}
              </svg>
              <div className="absolute text-center">
                <span className="text-lg font-bold text-foreground">{totalMenuBookings}</span>
                <span className="block text-[10px] text-muted">回</span>
              </div>
            </div>

            {/* メニュー一覧 */}
            <div className="flex-1 space-y-2 w-full">
              {menuBreakdown.map((menu, i) => {
                const color = MENU_COLORS[i % MENU_COLORS.length];
                const pct = totalMenuBookings > 0 ? Math.round((menu.booking_count / totalMenuBookings) * 100) : 0;
                return (
                  <div key={menu.service_id} className="flex items-center gap-3">
                    <div className={`h-3 w-3 shrink-0 rounded-full ${color.bg}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <p className="text-sm font-medium truncate">{menu.service_name}</p>
                        <div className="ml-2 shrink-0 flex items-center gap-2">
                          <span className="text-xs text-muted">{menu.booking_count}回</span>
                          <span className="text-xs font-semibold text-foreground">{pct}%</span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-border/30 mr-2">
                          <div
                            className={`h-full rounded-full ${color.bg} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted shrink-0">
                          {menu.total_revenue.toLocaleString()}円
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* 合計 */}
              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                <span className="text-xs font-semibold text-muted">合計</span>
                <span className="text-sm font-bold text-foreground">
                  {totalMenuRevenue.toLocaleString()}円
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 月別来店頻度 */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <h3 className="text-sm font-semibold text-foreground">月別来店頻度（過去6ヶ月）</h3>
        </div>
        <MonthlyVisitsChart data={monthlyVisits} />
      </section>

      {/* 今後の予約 */}
      {futureBookings.length > 0 && (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-accent/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h3 className="text-sm font-semibold text-foreground">今後の予約</h3>
            </div>
            <span className="text-xs text-muted">{futureBookings.length}件</span>
          </div>
          <div className="space-y-2">
            {futureBookings.map((b) => {
              const svc = Array.isArray(b.services) ? b.services[0] : b.services;
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl bg-accent/5 p-3.5 text-sm ring-1 ring-accent/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">{formatDateTime(b.start_at)}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {svc?.name || "不明"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {svc?.price ? `${svc.price.toLocaleString()}円` : "-"}
                    </p>
                    <span className="text-xs font-medium text-accent">予約済み</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 予約履歴（ページネーション付き） */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <h3 className="text-sm font-semibold text-foreground">予約履歴</h3>
          </div>
          {pastBookings.length > 0 && (
            <span className="text-xs text-muted">{pastBookings.length}件</span>
          )}
        </div>

        {pastBookings.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">予約履歴がありません</p>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedBookings.map((b) => {
                const svc = Array.isArray(b.services) ? b.services[0] : b.services;
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl bg-background p-3.5 text-sm transition-colors hover:bg-background/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        b.status === "confirmed"
                          ? "bg-accent/10 text-accent"
                          : "bg-red-50 text-red-500"
                      }`}>
                        {b.status === "confirmed" ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{formatDateTime(b.start_at)}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {svc?.name || "不明"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {svc?.price ? `${svc.price.toLocaleString()}円` : "-"}
                      </p>
                      <span
                        className={`text-xs font-medium ${
                          b.status === "confirmed"
                            ? "text-accent"
                            : "text-red-500"
                        }`}
                      >
                        {b.status === "confirmed" ? "確定" : `キャンセル${b.cancelled_by === "customer" ? "(お客様)" : "(事業主)"}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ページネーション */}
            {showPagination && (
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  前へ
                </button>
                <span className="text-xs text-muted">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  次へ
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* メモ・カスタム項目 */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <h3 className="text-sm font-semibold text-foreground">メモ</h3>
        </div>
        <textarea
          value={memo}
          onChange={(e) => {
            setMemo(e.target.value);
            setSaved(false);
          }}
          placeholder="この顧客のメモを入力..."
          rows={4}
          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-accent/30 resize-none transition-all"
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
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
          >
            {isPending ? "保存中..." : "保存"}
          </button>
          {saved && (
            <span className="text-sm text-accent font-medium">保存しました</span>
          )}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  avg,
  isAboveAvg,
  invertComparison,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  avg?: string;
  isAboveAvg?: boolean;
  invertComparison?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60 shadow-sm">
      <div className="flex items-center gap-2 text-muted">
        <span className="flex items-center opacity-50">{icon}</span>
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
      {avg !== undefined && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {isAboveAvg !== undefined && (
            <span
              className={`inline-flex h-4 items-center rounded-md px-1.5 text-[10px] font-bold ${
                isAboveAvg
                  ? "bg-emerald-100 text-emerald-700"
                  : invertComparison
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {isAboveAvg ? (
                invertComparison ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                )
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
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
