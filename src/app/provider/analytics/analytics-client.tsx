"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAnalyticsBySegment, type SegmentKey, type DateRangeKey } from "@/lib/actions/analytics";

interface MonthlyStat {
  month: string;
  booking_count: number;
  revenue: number;
  cancel_count: number;
  cancel_rate: number;
  unique_customers: number;
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

interface MonthlyAvgInterval {
  month: string;
  avg_interval_days: number;
}

interface AvgBookingInterval {
  avg_interval_days: number;
  total_customers: number;
  customers_with_interval: number;
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
  avg_booking_interval?: number;
}

// 顧客セグメントの色パレット
const SEGMENT_COLORS = [
  { bg: "bg-emerald-500", hex: "#10b981" },
  { bg: "bg-blue-500", hex: "#3b82f6" },
  { bg: "bg-amber-400", hex: "#fbbf24" },
  { bg: "bg-red-400", hex: "#f87171" },
];

type PeriodKey = "month" | "quarter" | "year";

const PERIOD_OPTIONS: { key: PeriodKey; label: string; months: number }[] = [
  { key: "month", label: "月", months: 6 },
  { key: "quarter", label: "四半期", months: 12 },
  { key: "year", label: "年", months: 24 },
];

const DATE_RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "all", label: "全期間" },
  { key: "this_year", label: "今年" },
  { key: "this_month", label: "今月" },
];

const SEGMENT_OPTIONS: { key: SegmentKey; label: string }[] = [
  { key: "all", label: "全体" },
  { key: "excellent", label: "優良" },
  { key: "normal", label: "通常" },
  { key: "dormant", label: "休眠" },
  { key: "at_risk", label: "離脱リスク" },
];

interface BusinessHoursEntry {
  open: string;
  close: string;
}

type BusinessHours = Record<string, BusinessHoursEntry | null>;

export function AnalyticsClient({
  allMonthlyData,
  monthlyAvgInterval,
  popularMenus,
  heatmapData,
  avgBookingInterval,
  ltvStats,
  benchmark,
  businessHours,
}: {
  allMonthlyData: MonthlyStat[];
  monthlyAvgInterval: MonthlyAvgInterval[];
  popularMenus: PopularMenu[];
  heatmapData: HeatmapCell[];
  avgBookingInterval: AvgBookingInterval;
  ltvStats: LtvStats;
  benchmark: Benchmark;
  businessHours: BusinessHours | null;
}) {
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [chartTab, setChartTab] = useState<"bookings" | "revenue" | "interval" | "unitPrice">("bookings");
  const [segment, setSegment] = useState<SegmentKey>("all");
  const [dateRange, setDateRange] = useState<DateRangeKey>("this_year");
  const [isFilterLoading, startFilterTransition] = useTransition();

  // フィルターで変動するデータ（初期値はpropsから）
  const [segmentMonthlyData, setSegmentMonthlyData] = useState(allMonthlyData);
  const [segmentMonthlyAvgInterval, setSegmentMonthlyAvgInterval] = useState(monthlyAvgInterval);
  const [filteredAvgBookingInterval, setFilteredAvgBookingInterval] = useState(avgBookingInterval);
  const [filteredPopularMenus, setFilteredPopularMenus] = useState(popularMenus);
  const [filteredHeatmapData, setFilteredHeatmapData] = useState(heatmapData);
  const [filteredLtvStats, setFilteredLtvStats] = useState(ltvStats);

  // 期間フィルターのロジック: 月別データは月の文字列でクライアント側スライス
  const filterByDateRange = <T extends { month: string }>(data: T[]): T[] => {
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    if (dateRange === "this_month") {
      return data.filter((d) => d.month === currentMonth);
    }
    if (dateRange === "this_year") {
      return data.filter((d) => d.month.startsWith(currentYear));
    }
    // all: 全期間
    return data;
  };

  const filteredMonthlyData = filterByDateRange(segmentMonthlyData);
  const filteredMonthlyAvgInterval = filterByDateRange(segmentMonthlyAvgInterval);

  // サーバーにフィルター条件を送信して全セクションのデータを再取得
  function fetchFilteredData(newSegment: SegmentKey, newDateRange: DateRangeKey) {
    startFilterTransition(async () => {
      try {
        const data = await getAnalyticsBySegment(newSegment, newDateRange);
        setSegmentMonthlyData(data.allMonthlyData);
        setSegmentMonthlyAvgInterval(data.monthlyAvgInterval);
        setFilteredAvgBookingInterval(data.avgBookingInterval);
        setFilteredPopularMenus(data.popularMenus);
        setFilteredHeatmapData(data.heatmapData);
        setFilteredLtvStats(data.ltvStats);
      } catch (err) {
        console.error("[AnalyticsClient] フィルター エラー:", err);
        // エラー時は「全体」「全期間」に戻し、初期データ（全期間）を復元
        setSegment("all");
        setDateRange("all");
        setSegmentMonthlyData(allMonthlyData);
        setSegmentMonthlyAvgInterval(monthlyAvgInterval);
        setFilteredAvgBookingInterval(avgBookingInterval);
        setFilteredPopularMenus(popularMenus);
        setFilteredHeatmapData(heatmapData);
        setFilteredLtvStats(ltvStats);
      }
    });
  }

  function handleSegmentChange(newSegment: SegmentKey) {
    setSegment(newSegment);
    if (newSegment === "all" && dateRange === "all") {
      // 全体 + 全期間の場合は初期データに戻す（サーバーコール不要）
      setSegmentMonthlyData(allMonthlyData);
      setSegmentMonthlyAvgInterval(monthlyAvgInterval);
      setFilteredAvgBookingInterval(avgBookingInterval);
      setFilteredPopularMenus(popularMenus);
      setFilteredHeatmapData(heatmapData);
      setFilteredLtvStats(ltvStats);
      return;
    }
    fetchFilteredData(newSegment, dateRange);
  }

  function handleDateRangeChange(newDateRange: DateRangeKey) {
    setDateRange(newDateRange);
    if (segment === "all" && newDateRange === "all") {
      // 全体 + 全期間の場合は初期データに戻す
      setSegmentMonthlyData(allMonthlyData);
      setSegmentMonthlyAvgInterval(monthlyAvgInterval);
      setFilteredAvgBookingInterval(avgBookingInterval);
      setFilteredPopularMenus(popularMenus);
      setFilteredHeatmapData(heatmapData);
      setFilteredLtvStats(ltvStats);
      return;
    }
    fetchFilteredData(segment, newDateRange);
  }

  // 初回マウント時: デフォルト dateRange が "all" でなければフィルター適用済みデータを取得
  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!initialFetchDone.current && dateRange !== "all") {
      initialFetchDone.current = true;
      fetchFilteredData(segment, dateRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 24ヶ月分のデータから期間に応じてスライス（末尾N件を取得）
  const getStatsForPeriod = (): MonthlyStat[] => {
    const months = PERIOD_OPTIONS.find((o) => o.key === period)?.months ?? 6;
    return filteredMonthlyData.slice(-months);
  };

  const currentStats = getStatsForPeriod();

  // KPI用: 期間フィルター内の累計を計算
  const cumulativeBookingCount = filteredMonthlyData.reduce((sum, d) => sum + d.booking_count, 0);
  const cumulativeRevenue = filteredMonthlyData.reduce((sum, d) => sum + d.revenue, 0);

  // 顧客単価 = 累計売上 / ユニーク顧客数
  // フィルター適用済みの ltvStats からセグメント合計を計算（セグメント+期間フィルター適用済み）
  const totalSegments =
    filteredLtvStats.segments.excellent +
    filteredLtvStats.segments.normal +
    filteredLtvStats.segments.dormant +
    filteredLtvStats.segments.at_risk;
  const cumulativeUnitPrice = totalSegments > 0
    ? Math.round(cumulativeRevenue / totalSegments)
    : null;

  // 前月比: 常に「先月 vs 先々月」で計算（期間フィルター・セグメントフィルターの影響を受けない）
  // allMonthlyData（props の元データ、フィルターなし）の末尾から先月・先々月を取得
  // 当月（月途中）は比較に使わない
  const getMomComparison = () => {
    if (allMonthlyData.length < 2) return { lastMonth: null, prevMonth: null };
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 当月を除外して末尾2件を取得
    const pastMonths = allMonthlyData.filter((d) => d.month < currentMonth);
    if (pastMonths.length < 2) return { lastMonth: null, prevMonth: null };
    const lastMonth = pastMonths[pastMonths.length - 1];
    const prevMonth = pastMonths[pastMonths.length - 2];
    return { lastMonth, prevMonth };
  };

  const { lastMonth: momLastMonth, prevMonth: momPrevMonth } = getMomComparison();
  const bookingDiff = momLastMonth && momPrevMonth && momLastMonth.booking_count > 0
    ? momLastMonth.booking_count - momPrevMonth.booking_count
    : null;
  const revenueDiff = momLastMonth && momPrevMonth && momLastMonth.booking_count > 0
    ? momLastMonth.revenue - momPrevMonth.revenue
    : null;
  const momLastUnitPrice = momLastMonth && momLastMonth.unique_customers > 0
    ? Math.round(momLastMonth.revenue / momLastMonth.unique_customers)
    : null;
  const momPrevUnitPrice = momPrevMonth && momPrevMonth.unique_customers > 0
    ? Math.round(momPrevMonth.revenue / momPrevMonth.unique_customers)
    : null;
  const unitPriceDiff = momLastUnitPrice !== null && momPrevUnitPrice !== null
    ? momLastUnitPrice - momPrevUnitPrice
    : null;

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
      // 四半期のユニーク顧客数は各月の合計（近似値、正確にはRPC側で集計が必要）
      const totalUniqueCustomers = chunk.reduce((s, c) => s + (c.unique_customers || 0), 0);
      quarters.push({
        month: chunk[0].month,
        booking_count: totalBookings,
        revenue: totalRevenue,
        cancel_count: totalCancels,
        cancel_rate: totalAll > 0 ? Math.round((totalCancels / totalAll) * 1000) / 10 : 0,
        unique_customers: totalUniqueCustomers,
      });
    }
    return quarters;
  };

  // 年表示の場合はデータを年ごとに集計
  const aggregateYearly = (data: MonthlyStat[]): MonthlyStat[] => {
    if (period !== "year" || data.length === 0) return data;
    const yearMap = new Map<string, MonthlyStat[]>();
    for (const stat of data) {
      const year = stat.month.slice(0, 4);
      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year)!.push(stat);
    }
    const years: MonthlyStat[] = [];
    for (const [year, chunks] of yearMap) {
      const totalBookings = chunks.reduce((s, c) => s + c.booking_count, 0);
      const totalRevenue = chunks.reduce((s, c) => s + c.revenue, 0);
      const totalCancels = chunks.reduce((s, c) => s + c.cancel_count, 0);
      const totalAll = totalBookings + totalCancels;
      const totalUniqueCustomers = chunks.reduce((s, c) => s + (c.unique_customers || 0), 0);
      years.push({
        month: `${year}-01`,
        booking_count: totalBookings,
        revenue: totalRevenue,
        cancel_count: totalCancels,
        cancel_rate: totalAll > 0 ? Math.round((totalCancels / totalAll) * 1000) / 10 : 0,
        unique_customers: totalUniqueCustomers,
      });
    }
    return years;
  };

  const displayStats = period === "quarter" ? aggregateQuarterly(currentStats) : period === "year" ? aggregateYearly(currentStats) : currentStats;

  // 月別平均予約間隔データを期間に応じてスライス・集約
  const getIntervalForPeriod = (): MonthlyAvgInterval[] => {
    const months = PERIOD_OPTIONS.find((o) => o.key === period)?.months ?? 6;
    const sliced = filteredMonthlyAvgInterval.slice(-months);
    if (period === "quarter") {
      const quarters: MonthlyAvgInterval[] = [];
      for (let i = 0; i < sliced.length; i += 3) {
        const chunk = sliced.slice(i, i + 3);
        if (chunk.length === 0) continue;
        const nonZero = chunk.filter((c) => c.avg_interval_days > 0);
        quarters.push({
          month: chunk[0].month,
          avg_interval_days: nonZero.length > 0
            ? Math.round(nonZero.reduce((s, c) => s + c.avg_interval_days, 0) / nonZero.length * 10) / 10
            : 0,
        });
      }
      return quarters;
    }
    if (period === "year") {
      const yearMap = new Map<string, MonthlyAvgInterval[]>();
      for (const item of sliced) {
        const year = item.month.slice(0, 4);
        if (!yearMap.has(year)) yearMap.set(year, []);
        yearMap.get(year)!.push(item);
      }
      const years: MonthlyAvgInterval[] = [];
      for (const [year, chunks] of yearMap) {
        const nonZero = chunks.filter((c) => c.avg_interval_days > 0);
        years.push({
          month: `${year}-01`,
          avg_interval_days: nonZero.length > 0
            ? Math.round(nonZero.reduce((s, c) => s + c.avg_interval_days, 0) / nonZero.length * 10) / 10
            : 0,
        });
      }
      return years;
    }
    return sliced;
  };

  const intervalForPeriod = getIntervalForPeriod();

  // intervalForPeriod を month でインデックス化
  const intervalMap = new Map(intervalForPeriod.map((d) => [d.month, d.avg_interval_days]));

  const chartMonthly = displayStats.map((s) => {
    const uniqueCustomers = s.unique_customers || 0;
    return {
      month: s.month,
      bookings: s.booking_count,
      revenue: s.revenue,
      cancelRate: s.cancel_rate,
      unitPrice: uniqueCustomers > 0 ? Math.round(s.revenue / uniqueCustomers) : 0,
      interval: intervalMap.get(s.month) ?? 0,
    };
  });

  // 月曜始まりの曜日ラベル
  const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];
  // DOW(PostgreSQL): 日=0, 月=1, 火=2, 水=3, 木=4, 金=5, 土=6
  // 表示行: 月=0, 火=1, 水=2, 木=3, 金=4, 土=5, 日=6
  // DOW → 表示行: DOW 1→0, 2→1, 3→2, 4→3, 5→4, 6→5, 0→6
  const dowToRow = (dow: number) => (dow === 0 ? 6 : dow - 1);

  // 営業時間からX軸の範囲を算出
  const { heatmapStartHour, heatmapEndHour } = (() => {
    if (!businessHours) return { heatmapStartHour: 9, heatmapEndHour: 20 };
    let minStart = 24;
    let maxEnd = 0;
    let hasAny = false;
    for (const key of Object.keys(businessHours)) {
      const entry = businessHours[key];
      if (!entry) continue;
      hasAny = true;
      const startH = parseInt(entry.open.split(":")[0], 10);
      const endH = parseInt(entry.close.split(":")[0], 10);
      // close が "21:00" → X軸に10~21を表示（21時台の列を含める）
      const effectiveEnd = endH;
      if (startH < minStart) minStart = startH;
      if (effectiveEnd > maxEnd) maxEnd = effectiveEnd;
    }
    if (!hasAny) return { heatmapStartHour: 9, heatmapEndHour: 20 };
    return { heatmapStartHour: minStart, heatmapEndHour: maxEnd };
  })();
  // heatmapEndHour を含む（例: start=10, end=21 → [10,11,...,21]）
  const heatmapHours = Array.from(
    { length: heatmapEndHour - heatmapStartHour + 1 },
    (_, i) => i + heatmapStartHour
  );

  // ヒートマップデータの整形（フィルタリング済みデータを使用）
  // 行は月曜始まり（0=月, 1=火, ..., 6=日）
  const heatmapGrid: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );
  let maxHeat = 1;
  for (const cell of filteredHeatmapData) {
    const row = dowToRow(cell.day_of_week);
    heatmapGrid[row][cell.hour_of_day] = cell.booking_count;
    if (cell.booking_count > maxHeat) maxHeat = cell.booking_count;
  }

  // 人気メニューの最大値（バー幅計算用、フィルタリング済みデータを使用）
  const maxMenuCount = Math.max(1, ...filteredPopularMenus.map((m) => m.booking_count));

  // 年を跨ぐかどうか判定
  const hasMultipleYears = (() => {
    const years = new Set(chartMonthly.map((d) => d.month.slice(0, 4)));
    return years.size > 1;
  })();

  // v は YYYY-MM 形式
  const formatTickLabel = (v: string, index: number) => {
    const year = v.slice(0, 4);
    const m = parseInt(v.slice(5, 7));
    if (period === "year") {
      return `${year}年`;
    }
    if (period === "quarter") {
      const q = Math.ceil(m / 3);
      if (index === 0) return `${year}年Q${q}`;
      const prevEntry = chartMonthly[index - 1];
      if (prevEntry && prevEntry.month.slice(0, 4) !== year) return `${year}年Q${q}`;
      return `Q${q}`;
    }
    // 月表示
    if (hasMultipleYears) {
      if (m === 12 || m === 1) return `${year}年${m}月`;
      return `${m}月`;
    }
    if (index === 0) return `${year}年${m}月`;
    return `${m}月`;
  };

  const formatTooltipLabel = (label: unknown) => {
    const str = String(label);
    const year = str.slice(0, 4);
    const m = parseInt(str.slice(5, 7));
    if (period === "year") {
      return `${year}年`;
    }
    if (period === "quarter") {
      const q = Math.ceil(m / 3);
      return `${year}年 第${q}四半期`;
    }
    return `${year}年${m}月`;
  };

  return (
    <div className="space-y-6">
      {/* フィルターエリア */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        {/* 期間フィルター */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="hidden sm:inline text-xs font-medium">期間</span>
          </div>
          <div className="flex gap-1.5">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleDateRangeChange(opt.key)}
                disabled={isFilterLoading}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  dateRange === opt.key
                    ? "bg-accent text-white shadow-sm"
                    : "bg-card text-muted ring-1 ring-border hover:text-foreground"
                } ${isFilterLoading ? "opacity-50" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* セグメントフィルター */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="hidden sm:inline text-xs font-medium">セグメント</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SEGMENT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSegmentChange(opt.key)}
                disabled={isFilterLoading}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  segment === opt.key
                    ? "bg-accent text-white shadow-sm"
                    : "bg-card text-muted ring-1 ring-border hover:text-foreground"
                } ${isFilterLoading ? "opacity-50" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {isFilterLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          )}
        </div>
      </div>

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
          label="予約実績"
          value={`${cumulativeBookingCount}件`}
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
          label="売上"
          value={`${cumulativeRevenue.toLocaleString()}円`}
          diff={revenueDiff}
          diffLabel="前月比"
          formatDiff={(v) => `${v > 0 ? "+" : ""}${v.toLocaleString()}円`}
        />
        <KpiSummaryCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          label="平均予約間隔"
          value={filteredAvgBookingInterval.avg_interval_days > 0 ? `${filteredAvgBookingInterval.avg_interval_days}日` : "-"}
          subText={filteredAvgBookingInterval.customers_with_interval > 0
            ? `${filteredAvgBookingInterval.customers_with_interval}人のリピーター`
            : "データなし"
          }
        />
        <KpiSummaryCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          }
          label="顧客単価"
          value={cumulativeUnitPrice !== null ? `${cumulativeUnitPrice.toLocaleString()}円` : "-"}
          diff={unitPriceDiff}
          diffLabel="前月比"
          formatDiff={(v) => `${v > 0 ? "+" : ""}${v.toLocaleString()}円`}
        />
      </div>

      {/* 推移グラフ（KPIカード対応タブ切り替え） */}
      <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/60">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <h3 className="text-sm font-semibold text-foreground">推移グラフ</h3>
          </div>
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

        {/* KPI対応タブ */}
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-background p-1 ring-1 ring-border">
          {([
            { key: "bookings", label: "予約実績" },
            { key: "revenue", label: "売上" },
            { key: "interval", label: "平均予約間隔" },
            { key: "unitPrice", label: "顧客単価" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setChartTab(tab.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                chartTab === tab.key
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {chartMonthly.length > 0 ? (() => {
          const chartColor =
            chartTab === "bookings" ? "var(--accent)" :
            chartTab === "revenue" ? "#6366f1" :
            chartTab === "interval" ? "#3b82f6" :
            "#f59e0b";
          const chartColorVar =
            chartTab === "bookings" ? "var(--color-accent)" :
            chartTab === "revenue" ? "#6366f1" :
            chartTab === "interval" ? "#3b82f6" :
            "#f59e0b";
          const chartDataKey =
            chartTab === "bookings" ? "bookings" :
            chartTab === "revenue" ? "revenue" :
            chartTab === "interval" ? "interval" :
            "unitPrice";
          const isCurrencyAxis = chartTab === "revenue" || chartTab === "unitPrice";
          const yTickFormatter = isCurrencyAxis
            ? (v: number) => v.toLocaleString()
            : undefined;

          return (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartMonthly}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatTickLabel}
                  fontSize={period === "month" && hasMultipleYears ? 10 : 12}
                  stroke="var(--color-muted)"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={chartTab === "interval"}
                  fontSize={12}
                  stroke="var(--color-muted)"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={yTickFormatter}
                />
                <Tooltip
                  formatter={(value) => {
                    if (chartTab === "bookings") return [`${value}件`, "予約実績"];
                    if (chartTab === "revenue") return [`${Number(value).toLocaleString()}円`, "売上"];
                    if (chartTab === "interval") return [`${value}日`, "平均予約間隔"];
                    return [`${Number(value).toLocaleString()}円`, "顧客単価"];
                  }}
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
                  dataKey={chartDataKey}
                  stroke={chartColorVar}
                  strokeWidth={2.5}
                  fill="url(#chartGradient)"
                  dot={{ r: 4, fill: "var(--card)", stroke: chartColor, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: chartColor, stroke: "var(--card)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          );
        })() : (
          <EmptyState />
        )}
      </section>

      {/* 4. 人気メニューランキング */}
      <ChartCard
        title="人気メニューランキング"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        }
      >
        {filteredPopularMenus.length > 0 ? (
          <div className="space-y-3">
            {filteredPopularMenus.map((m, i) => {
              const barWidth = maxMenuCount > 0
                ? Math.round((m.booking_count / maxMenuCount) * 100)
                : 0;
              return (
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
                          width: `${barWidth}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
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
              {heatmapHours.map((h) => (
                <div key={h} className="flex-1 text-center text-xs text-muted">
                  {h}
                </div>
              ))}
            </div>
            {DAY_LABELS.map((day, dayIdx) => (
              <div key={dayIdx} className="flex items-center">
                <div className="w-8 text-xs font-medium text-muted">{day}</div>
                {heatmapHours.map((h) => {
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

      {/* 6+7. 新規 vs リピーター比率 + キャンセル率 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 新規 vs リピーター比率 */}
        <ChartCard
          title="新規 vs リピーター比率"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        >
          {(() => {
            const totalCustomers = filteredAvgBookingInterval.total_customers;
            const repeaters = filteredAvgBookingInterval.customers_with_interval;
            const newCustomers = totalCustomers - repeaters;
            const repeaterPct = totalCustomers > 0 ? Math.round((repeaters / totalCustomers) * 100) : 0;
            const newPct = totalCustomers > 0 ? 100 - repeaterPct : 0;

            if (totalCustomers === 0) {
              return <EmptyState />;
            }

            const circumference = 2 * Math.PI * 40;
            const repeaterDash = (repeaterPct / 100) * circumference;
            const newDash = (newPct / 100) * circumference;

            return (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* ドーナツチャート */}
                <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                  <svg className="h-36 w-36 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="12" opacity="0.3" />
                    {newCustomers > 0 && (
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.max(0, newDash - (repeaters > 0 ? 2 : 0))} ${circumference - Math.max(0, newDash - (repeaters > 0 ? 2 : 0))}`}
                        strokeDashoffset="0"
                        className="transition-all duration-700"
                      />
                    )}
                    {repeaters > 0 && (
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.max(0, repeaterDash - (newCustomers > 0 ? 2 : 0))} ${circumference - Math.max(0, repeaterDash - (newCustomers > 0 ? 2 : 0))}`}
                        strokeDashoffset={-newDash}
                        className="transition-all duration-700"
                      />
                    )}
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-lg font-bold text-foreground">{totalCustomers}</span>
                    <span className="block text-[10px] text-muted">人</span>
                  </div>
                </div>

                {/* ラベル */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 shrink-0 rounded-full bg-blue-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <p className="text-sm font-medium">新規</p>
                        <div className="ml-2 shrink-0 flex items-center gap-2">
                          <span className="text-xs text-muted">{newCustomers}人</span>
                          <span className="text-xs font-semibold text-foreground">{newPct}%</span>
                        </div>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border/30">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${newPct}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">初めて来店した顧客</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <p className="text-sm font-medium">リピーター</p>
                        <div className="ml-2 shrink-0 flex items-center gap-2">
                          <span className="text-xs text-muted">{repeaters}人</span>
                          <span className="text-xs font-semibold text-foreground">{repeaterPct}%</span>
                        </div>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border/30">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${repeaterPct}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">2回以上来店した顧客</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </ChartCard>

        {/* キャンセル率 */}
        <ChartCard
          title="キャンセル率"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        >
          {(() => {
            const totalBookings = filteredMonthlyData.reduce((sum, d) => sum + d.booking_count + d.cancel_count, 0);
            const totalCancels = filteredMonthlyData.reduce((sum, d) => sum + d.cancel_count, 0);
            const cancelRate = totalBookings > 0 ? Math.round((totalCancels / totalBookings) * 1000) / 10 : 0;
            const confirmedCount = totalBookings - totalCancels;

            if (totalBookings === 0) {
              return <EmptyState />;
            }

            // 色: 低い（緑） → 高い（赤）
            const getCancelRateColor = (rate: number) => {
              if (rate <= 5) return { text: "text-emerald-600", bg: "bg-emerald-500", hex: "#10b981", label: "とても良い" };
              if (rate <= 10) return { text: "text-emerald-500", bg: "bg-emerald-400", hex: "#34d399", label: "良い" };
              if (rate <= 20) return { text: "text-amber-500", bg: "bg-amber-400", hex: "#fbbf24", label: "やや高め" };
              if (rate <= 30) return { text: "text-orange-500", bg: "bg-orange-400", hex: "#fb923c", label: "注意" };
              return { text: "text-red-500", bg: "bg-red-400", hex: "#f87171", label: "要改善" };
            };

            const rateStyle = getCancelRateColor(cancelRate);
            const confirmedPct = totalBookings > 0 ? Math.round((confirmedCount / totalBookings) * 100) : 0;
            const cancelPct = 100 - confirmedPct;

            return (
              <div className="space-y-4">
                {/* メイン数値 */}
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-background ring-1 ring-border/60">
                    <div className="text-center">
                      <span className={`text-2xl font-bold ${rateStyle.text}`}>
                        {cancelRate}
                      </span>
                      <span className={`block text-xs font-medium ${rateStyle.text} opacity-70`}>%</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm text-foreground">
                      全{totalBookings}件中 <span className="font-semibold">{totalCancels}件</span> キャンセル
                    </p>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: `${rateStyle.hex}15`, color: rateStyle.hex }}
                    >
                      {rateStyle.label}
                    </span>
                  </div>
                </div>

                {/* 横棒グラフ */}
                <div className="space-y-2">
                  <div className="flex h-4 overflow-hidden rounded-full bg-border/30">
                    <div
                      className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${confirmedPct}%` }}
                    />
                    {cancelPct > 0 && (
                      <div
                        className="h-full rounded-r-full bg-red-400 transition-all duration-500"
                        style={{ width: `${cancelPct}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>確定 {confirmedCount}件 ({confirmedPct}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-red-400" />
                      <span>キャンセル {totalCancels}件 ({cancelPct}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </ChartCard>
      </div>

      {/* 8. 顧客セグメント分布（「全体」選択時のみ表示） */}
      {segment === "all" && <ChartCard
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
        {totalSegments > 0 ? (() => {
          const segmentData = [
            { key: "excellent", label: "優良", count: filteredLtvStats.segments.excellent, desc: "5回以上来店、定期的に来店" },
            { key: "normal", label: "通常", count: filteredLtvStats.segments.normal, desc: "2-4回来店、定期的に来店" },
            { key: "dormant", label: "休眠", count: filteredLtvStats.segments.dormant, desc: "来店間隔が空いている" },
            { key: "at_risk", label: "離脱リスク", count: filteredLtvStats.segments.at_risk, desc: "1回のみ or 長期間未来店" },
          ];
          return (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* ドーナツチャート */}
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                <svg className="h-36 w-36 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="12" opacity="0.3" />
                  {segmentData.reduce<{ offset: number; elements: React.ReactNode[] }>((acc, seg, i) => {
                    const pct = totalSegments > 0 ? (seg.count / totalSegments) * 100 : 0;
                    const circumference = 2 * Math.PI * 40;
                    const dashLength = (pct / 100) * circumference;
                    const gap = segmentData.filter(s => s.count > 0).length > 1 ? 2 : 0;
                    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                    if (seg.count > 0) {
                      acc.elements.push(
                        <circle
                          key={seg.key}
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
                    }
                    acc.offset += dashLength;
                    return acc;
                  }, { offset: 0, elements: [] }).elements}
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-bold text-foreground">{totalSegments}</span>
                  <span className="block text-[10px] text-muted">人</span>
                </div>
              </div>

              {/* セグメント一覧 */}
              <div className="flex-1 space-y-2 w-full">
                {segmentData.map((seg, i) => {
                  const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                  const pct = totalSegments > 0 ? Math.round((seg.count / totalSegments) * 100) : 0;
                  return (
                    <div key={seg.key} className="flex items-center gap-3">
                      <div className={`h-3 w-3 shrink-0 rounded-full ${color.bg}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <p className="text-sm font-medium truncate">{seg.label}</p>
                          <div className="ml-2 shrink-0 flex items-center gap-2">
                            <span className="text-xs text-muted">{seg.count}人</span>
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
                            {seg.desc}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })() : (
          <EmptyState />
        )}
      </ChartCard>}

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
                label="月間予約実績"
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
                label="平均予約間隔"
                value={benchmark.avg_booking_interval ? `${benchmark.avg_booking_interval}日` : "-"}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
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
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  diff?: number | null;
  diffLabel?: string;
  subText?: string;
  invertColor?: boolean;
  formatDiff?: (v: number) => string;
  badge?: { label: string; color: string; bgColor: string };
}) {
  const getDiffColor = (v: number) => {
    if (invertColor) return v > 0 ? "text-red-500" : v < 0 ? "text-emerald-600" : "text-muted";
    return v > 0 ? "text-emerald-600" : v < 0 ? "text-red-500" : "text-muted";
  };

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
      <div className="flex items-center gap-2 text-muted">
        <span className="flex items-center opacity-60">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
      {badge && (
        <span className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.bgColor} ${badge.color}`}>
          {badge.label}
        </span>
      )}
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
