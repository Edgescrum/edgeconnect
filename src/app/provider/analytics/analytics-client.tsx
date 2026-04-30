"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyStat {
  month: string;
  booking_count: number;
  revenue: number;
  cancel_count: number;
  cancel_rate: number;
}

interface PopularMenu {
  service_id: number;
  service_name: string;
  booking_count: number;
}

interface HeatmapCell {
  day_of_week: number;
  hour_of_day: number;
  booking_count: number;
}

interface RepeatRate {
  total_customers: number;
  repeat_customers: number;
  repeat_rate: number;
}

interface LtvStats {
  avg_ltv: number;
  segments: {
    excellent: number;
    normal: number;
    dormant: number;
    at_risk: number;
  };
}

interface Benchmark {
  available: boolean;
  provider_count: number;
  avg_monthly_bookings?: number;
  avg_monthly_revenue?: number;
  avg_repeat_rate?: number;
}

type PeriodKey = "month" | "quarter" | "year";

const PERIOD_OPTIONS: { key: PeriodKey; label: string; months: number }[] = [
  { key: "month", label: "月", months: 6 },
  { key: "quarter", label: "四半期", months: 12 },
  { key: "year", label: "年", months: 24 },
];

export function AnalyticsClient({
  monthlyStats,
  popularMenus,
  heatmapData,
  repeatRate,
  ltvStats,
  benchmark,
  allMonthlyStats,
}: {
  monthlyStats: MonthlyStat[];
  popularMenus: PopularMenu[];
  heatmapData: HeatmapCell[];
  repeatRate: RepeatRate;
  ltvStats: LtvStats;
  benchmark: Benchmark;
  allMonthlyStats?: { month6: MonthlyStat[]; month12: MonthlyStat[]; month24: MonthlyStat[] };
}) {
  const [period, setPeriod] = useState<PeriodKey>("month");

  // 期間に応じたデータを取得
  const getStatsForPeriod = (): MonthlyStat[] => {
    if (!allMonthlyStats) return monthlyStats;
    switch (period) {
      case "month":
        return allMonthlyStats.month6;
      case "quarter":
        return allMonthlyStats.month12;
      case "year":
        return allMonthlyStats.month24;
      default:
        return monthlyStats;
    }
  };

  const currentStats = getStatsForPeriod();

  // 四半期表示の場合はデータを3ヶ月ごとに集計
  const aggregateQuarterly = (data: MonthlyStat[]): MonthlyStat[] => {
    if (period !== "quarter" || data.length === 0) return data;
    const quarters: MonthlyStat[] = [];
    for (let i = 0; i < data.length; i += 3) {
      const chunk = data.slice(i, i + 3);
      if (chunk.length === 0) continue;
      const totalBookings = chunk.reduce((s, c) => s + c.booking_count, 0);
      const totalRevenue = chunk.reduce((s, c) => s + c.revenue, 0);
      const totalCancels = chunk.reduce((s, c) => s + c.cancel_count, 0);
      const totalAll = totalBookings + totalCancels;
      quarters.push({
        month: chunk[0].month,
        booking_count: totalBookings,
        revenue: totalRevenue,
        cancel_count: totalCancels,
        cancel_rate: totalAll > 0 ? Math.round((totalCancels / totalAll) * 1000) / 10 : 0,
      });
    }
    return quarters;
  };

  const displayStats = period === "quarter" ? aggregateQuarterly(currentStats) : currentStats;

  const chartMonthly = displayStats.map((s) => ({
    month: s.month.slice(5),
    fullMonth: s.month,
    bookings: s.booking_count,
    revenue: s.revenue,
    cancelRate: s.cancel_rate,
  }));

  // 前月比の計算
  const currentMonth = monthlyStats.length > 0 ? monthlyStats[monthlyStats.length - 1] : null;
  const prevMonth = monthlyStats.length > 1 ? monthlyStats[monthlyStats.length - 2] : null;

  const bookingDiff = currentMonth && prevMonth
    ? currentMonth.booking_count - prevMonth.booking_count
    : null;
  const revenueDiff = currentMonth && prevMonth
    ? currentMonth.revenue - prevMonth.revenue
    : null;
  const cancelRateDiff = currentMonth && prevMonth
    ? currentMonth.cancel_rate - prevMonth.cancel_rate
    : null;

  const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

  // ヒートマップデータの整形
  const heatmapGrid: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );
  let maxHeat = 1;
  for (const cell of heatmapData) {
    heatmapGrid[cell.day_of_week][cell.hour_of_day] = cell.booking_count;
    if (cell.booking_count > maxHeat) maxHeat = cell.booking_count;
  }

  // 人気メニューの最大値
  const maxMenuCount = Math.max(1, ...popularMenus.map((m) => m.booking_count));

  const totalSegments =
    ltvStats.segments.excellent +
    ltvStats.segments.normal +
    ltvStats.segments.dormant +
    ltvStats.segments.at_risk;

  const formatTickLabel = (v: string) => {
    if (period === "quarter") {
      const m = parseInt(v);
      const q = Math.ceil(m / 3);
      return `Q${q}`;
    }
    return `${parseInt(v)}月`;
  };

  const formatTooltipLabel = (label: unknown) => {
    const str = String(label);
    if (period === "quarter") {
      const m = parseInt(str);
      const q = Math.ceil(m / 3);
      return `第${q}四半期`;
    }
    return `${parseInt(str)}月`;
  };

  return (
    <div className="space-y-6">
      {/* KPI サマリーカード */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiSummaryCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          label="今月の予約数"
          value={currentMonth ? `${currentMonth.booking_count}件` : "-"}
          diff={bookingDiff}
          diffLabel="前月比"
        />
        <KpiSummaryCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          label="今月の売上"
          value={currentMonth ? `${currentMonth.revenue.toLocaleString()}円` : "-"}
          diff={revenueDiff}
          diffLabel="前月比"
          formatDiff={(v) => `${v > 0 ? "+" : ""}${v.toLocaleString()}円`}
        />
        <KpiSummaryCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          label="リピート率"
          value={`${repeatRate.repeat_rate}%`}
          subText={`${repeatRate.repeat_customers} / ${repeatRate.total_customers}人`}
        />
        <KpiSummaryCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          label="キャンセル率"
          value={currentMonth ? `${currentMonth.cancel_rate}%` : "-"}
          diff={cancelRateDiff}
          diffLabel="前月比"
          invertColor
          formatDiff={(v) => `${v > 0 ? "+" : ""}${v}%`}
        />
      </div>

      {/* 期間切り替えボタン */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">推移グラフ</h3>
        <div className="flex rounded-xl bg-background p-1 ring-1 ring-border">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                period === opt.key
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. 予約数推移 - グラデーション付きエリアチャート */}
      <ChartCard
        title="予約数推移"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        }
      >
        {chartMonthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartMonthly}>
              <defs>
                <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
              <XAxis
                dataKey="month"
                tickFormatter={formatTickLabel}
                fontSize={12}
                stroke="var(--color-muted)"
                axisLine={false}
                tickLine={false}
              />
              <YAxis allowDecimals={false} fontSize={12} stroke="var(--color-muted)" axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [`${value}件`, "予約数"]}
                labelFormatter={formatTooltipLabel}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="bookings"
                stroke="var(--color-accent)"
                strokeWidth={2.5}
                fill="url(#bookingGradient)"
                dot={{ r: 4, fill: "var(--card)", stroke: "var(--accent)", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "var(--accent)", stroke: "var(--card)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </ChartCard>

      {/* 2+3. 売上 + キャンセル率 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ChartCard
          title="売上推移"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        >
          {chartMonthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartMonthly}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatTickLabel}
                  fontSize={11}
                  stroke="var(--color-muted)"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis fontSize={11} stroke="var(--color-muted)" axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()}円`, "売上"]}
                  labelFormatter={formatTooltipLabel}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "13px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={{ r: 3, fill: "var(--card)", stroke: "#6366f1", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard
          title="キャンセル率推移"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        >
          {chartMonthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartMonthly}>
                <defs>
                  <linearGradient id="cancelGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatTickLabel}
                  fontSize={11}
                  stroke="var(--color-muted)"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis unit="%" fontSize={11} stroke="var(--color-muted)" axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${value}%`, "キャンセル率"]}
                  labelFormatter={formatTooltipLabel}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "13px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cancelRate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#cancelGradient)"
                  dot={{ r: 3, fill: "var(--card)", stroke: "#ef4444", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>
      </div>

      {/* 4. 人気メニューランキング */}
      <ChartCard
        title="人気メニューランキング"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        }
      >
        {popularMenus.length > 0 ? (
          <div className="space-y-3">
            {popularMenus.map((m, i) => (
              <div key={m.service_id} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  i === 0 ? "bg-yellow-100 text-yellow-700" :
                  i === 1 ? "bg-gray-100 text-gray-600" :
                  i === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-background text-muted"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium truncate">{m.service_name}</p>
                    <span className="ml-2 shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                      {m.booking_count}件
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all"
                      style={{
                        width: `${(m.booking_count / maxMenuCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </ChartCard>

      {/* 5. 曜日x時間帯ヒートマップ */}
      <ChartCard
        title="曜日 x 時間帯 別予約傾向"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        }
      >
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex">
              <div className="w-8" />
              {Array.from({ length: 12 }, (_, i) => i + 8).map((h) => (
                <div key={h} className="flex-1 text-center text-xs text-muted">
                  {h}
                </div>
              ))}
            </div>
            {DAY_LABELS.map((day, dayIdx) => (
              <div key={dayIdx} className="flex items-center">
                <div className="w-8 text-xs font-medium text-muted">{day}</div>
                {Array.from({ length: 12 }, (_, i) => i + 8).map((h) => {
                  const count = heatmapGrid[dayIdx][h];
                  const intensity = count / maxHeat;
                  return (
                    <div
                      key={h}
                      className="m-0.5 flex flex-1 items-center justify-center rounded-md text-xs transition-colors"
                      style={{
                        height: 28,
                        backgroundColor:
                          count > 0
                            ? `rgba(240, 140, 121, ${0.1 + intensity * 0.8})`
                            : "var(--color-background)",
                        color: intensity > 0.5 ? "white" : "var(--color-muted)",
                        fontWeight: intensity > 0.5 ? 600 : 400,
                      }}
                      title={`${day} ${h}時: ${count}件`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            ))}
            {/* 凡例 */}
            <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted">
              <span>少</span>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
                <div
                  key={opacity}
                  className="h-3 w-6 rounded-sm"
                  style={{ backgroundColor: `rgba(240, 140, 121, ${opacity})` }}
                />
              ))}
              <span>多</span>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* 6+7. リピート率 + 平均LTV */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ChartCard
          title="リピート率"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          }
        >
          <div className="flex items-center gap-6">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${repeatRate.repeat_rate * 2.64} ${264 - repeatRate.repeat_rate * 2.64}`}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute text-xl font-bold text-accent">
                {repeatRate.repeat_rate}%
              </span>
            </div>
            <div className="text-sm text-muted space-y-1.5">
              <p>
                全顧客数: <span className="font-semibold text-foreground">{repeatRate.total_customers}人</span>
              </p>
              <p>
                リピーター: <span className="font-semibold text-foreground">{repeatRate.repeat_customers}人</span>
              </p>
              <p className="text-xs opacity-70">2回以上来店した顧客の割合</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="平均LTV（顧客生涯価値）"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          }
        >
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
              <div className="text-center">
                <span className="text-2xl font-bold text-accent">
                  {Math.round(ltvStats.avg_ltv).toLocaleString()}
                </span>
                <span className="block text-xs font-medium text-accent/70">円</span>
              </div>
            </div>
            <div className="text-sm text-muted">
              <p>顧客1人あたりの平均累計売上</p>
              {totalSegments > 0 && (
                <p className="mt-1 text-xs opacity-70">
                  対象顧客数: {totalSegments}人
                </p>
              )}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* 8. 顧客セグメント分布 */}
      <ChartCard
        title="顧客セグメント分布"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      >
        {totalSegments > 0 ? (
          <div>
            {/* 積み上げバー */}
            <div className="mb-4 flex h-4 overflow-hidden rounded-full">
              {[
                { key: "excellent", count: ltvStats.segments.excellent, color: "bg-emerald-500" },
                { key: "normal", count: ltvStats.segments.normal, color: "bg-blue-500" },
                { key: "dormant", count: ltvStats.segments.dormant, color: "bg-amber-400" },
                { key: "at_risk", count: ltvStats.segments.at_risk, color: "bg-red-400" },
              ].map((seg) => {
                const pct = (seg.count / totalSegments) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={seg.key}
                    className={`${seg.color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>
            <div className="space-y-2.5">
              <SegmentRow
                label="優良"
                count={ltvStats.segments.excellent}
                total={totalSegments}
                color="bg-emerald-500"
                dotColor="bg-emerald-500"
                desc="5回以上来店、定期的に来店"
              />
              <SegmentRow
                label="通常"
                count={ltvStats.segments.normal}
                total={totalSegments}
                color="bg-blue-500"
                dotColor="bg-blue-500"
                desc="2-4回来店、定期的に来店"
              />
              <SegmentRow
                label="休眠"
                count={ltvStats.segments.dormant}
                total={totalSegments}
                color="bg-amber-400"
                dotColor="bg-amber-400"
                desc="来店間隔が空いている"
              />
              <SegmentRow
                label="離脱リスク"
                count={ltvStats.segments.at_risk}
                total={totalSegments}
                color="bg-red-400"
                dotColor="bg-red-400"
                desc="1回のみ or 長期間未来店"
              />
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </ChartCard>

      {/* 9. 業界ベンチマーク */}
      <ChartCard
        title="業界ベンチマーク比較"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        }
      >
        {benchmark.available ? (
          <div className="space-y-4">
            <p className="text-xs text-muted">
              同カテゴリ {benchmark.provider_count}事業者の平均との比較
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <BenchmarkCard
                label="月間予約数"
                value={`${benchmark.avg_monthly_bookings}件`}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                  </svg>
                }
              />
              <BenchmarkCard
                label="月間売上"
                value={`${(benchmark.avg_monthly_revenue || 0).toLocaleString()}円`}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                }
              />
              <BenchmarkCard
                label="リピート率"
                value={`${benchmark.avg_repeat_rate}%`}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                }
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-background p-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-sm text-muted">
              同カテゴリの事業者が5件以上になると、ベンチマーク比較が表示されます
              {benchmark.provider_count > 0 && `（現在 ${benchmark.provider_count}件）`}
            </p>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/60">
      <div className="mb-4 flex items-center gap-2">
        {icon && <span className="flex items-center">{icon}</span>}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-6 text-muted">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.4}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <p className="mt-2 text-sm">データがありません</p>
    </div>
  );
}

function KpiSummaryCard({
  icon,
  label,
  value,
  diff,
  diffLabel,
  subText,
  invertColor,
  formatDiff,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  diff?: number | null;
  diffLabel?: string;
  subText?: string;
  invertColor?: boolean;
  formatDiff?: (v: number) => string;
}) {
  const getDiffColor = (v: number) => {
    if (invertColor) return v > 0 ? "text-red-500" : v < 0 ? "text-emerald-600" : "text-muted";
    return v > 0 ? "text-emerald-600" : v < 0 ? "text-red-500" : "text-muted";
  };

  const getDiffArrow = (v: number) => {
    if (invertColor) return v > 0 ? "^" : v < 0 ? "v" : "";
    return v > 0 ? "^" : v < 0 ? "v" : "";
  };

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
      <div className="flex items-center gap-2 text-muted">
        <span className="flex items-center opacity-60">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
      {diff !== null && diff !== undefined && (
        <p className={`mt-1 text-xs font-medium ${getDiffColor(diff)}`}>
          <span className="inline-flex items-center gap-0.5">
            {diff > 0 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : diff < 0 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            ) : null}
            {formatDiff ? formatDiff(diff) : `${diff > 0 ? "+" : ""}${diff}`}
            {diffLabel && <span className="text-muted"> {diffLabel}</span>}
          </span>
        </p>
      )}
      {subText && <p className="mt-1 text-xs text-muted">{subText}</p>}
    </div>
  );
}

function SegmentRow({
  label,
  count,
  total,
  dotColor,
  desc,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  dotColor: string;
  desc: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <div>
          <span className="text-sm font-medium">{label}</span>
          <p className="text-xs text-muted">{desc}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-bold">{count}人</span>
        <span className="ml-1 text-xs text-muted">({pct}%)</span>
      </div>
    </div>
  );
}

function BenchmarkCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-background p-3.5">
      <div className="flex items-center gap-1.5 text-muted">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-1.5 text-lg font-bold">{value}</p>
    </div>
  );
}
