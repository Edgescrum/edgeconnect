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
  BarChart,
  Bar,
} from "recharts";
import { getAnalyticsBySegment, type SegmentKey, type DateRangeKey } from "@/lib/actions/analytics";
import { getSurveyAdvancedStats, type SurveyBasicStats, type SurveyAdvancedStats } from "@/lib/actions/survey-analytics";
import { generateSurveyAdvice } from "@/lib/constants/survey-advice-templates";

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
type AnalyticsTab = "booking" | "survey";

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
  plan,
  allMonthlyData,
  monthlyAvgInterval,
  popularMenus,
  heatmapData,
  avgBookingInterval,
  ltvStats,
  benchmark,
  businessHours,
  surveyBasicStats,
}: {
  plan: "basic" | "standard";
  allMonthlyData: MonthlyStat[];
  monthlyAvgInterval: MonthlyAvgInterval[];
  popularMenus: PopularMenu[];
  heatmapData: HeatmapCell[];
  avgBookingInterval: AvgBookingInterval;
  ltvStats: LtvStats;
  benchmark: Benchmark;
  businessHours: BusinessHours | null;
  surveyBasicStats: SurveyBasicStats;
}) {
  const isStandard = plan === "standard";
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("booking");
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [chartTab, setChartTab] = useState<"bookings" | "revenue" | "interval" | "unitPrice">("bookings");
  const [segment, setSegment] = useState<SegmentKey>("all");
  const [dateRange, setDateRange] = useState<DateRangeKey>("this_year");
  const [isFilterLoading, startFilterTransition] = useTransition();

  // Survey advanced stats (lazy loaded for standard plan)
  const [surveyAdvanced, setSurveyAdvanced] = useState<SurveyAdvancedStats | null>(null);
  const [surveyAdvancedLoading, setSurveyAdvancedLoading] = useState(false);
  // フィルターで変動するデータ（初期値はpropsから）
  const [segmentMonthlyData, setSegmentMonthlyData] = useState(allMonthlyData);
  const [segmentMonthlyAvgInterval, setSegmentMonthlyAvgInterval] = useState(monthlyAvgInterval);
  const [filteredAvgBookingInterval, setFilteredAvgBookingInterval] = useState(avgBookingInterval);
  const [filteredPopularMenus, setFilteredPopularMenus] = useState(popularMenus);
  const [filteredHeatmapData, setFilteredHeatmapData] = useState(heatmapData);
  const [filteredLtvStats, setFilteredLtvStats] = useState(ltvStats);

  // Load survey advanced stats when switching to survey tab or when filters change
  const lastSurveyFilter = useRef<string>("");
  useEffect(() => {
    if (activeTab === "survey" && isStandard) {
      const filterKey = `${segment}-${dateRange}`;
      if (lastSurveyFilter.current === filterKey && surveyAdvanced) return;
      lastSurveyFilter.current = filterKey;
      setSurveyAdvancedLoading(true);
      getSurveyAdvancedStats(segment, dateRange)
        .then(setSurveyAdvanced)
        .catch(console.error)
        .finally(() => setSurveyAdvancedLoading(false));
    }
  }, [activeTab, isStandard, segment, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // 初回マウント時
  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!initialFetchDone.current && dateRange !== "all" && isStandard) {
      initialFetchDone.current = true;
      fetchFilteredData(segment, dateRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 24ヶ月分のデータから期間に応じてスライス
  const getStatsForPeriod = (): MonthlyStat[] => {
    const months = PERIOD_OPTIONS.find((o) => o.key === period)?.months ?? 6;
    return filteredMonthlyData.slice(-months);
  };

  const currentStats = getStatsForPeriod();

  // KPI
  const cumulativeBookingCount = filteredMonthlyData.reduce((sum, d) => sum + d.booking_count, 0);
  const cumulativeRevenue = filteredMonthlyData.reduce((sum, d) => sum + d.revenue, 0);

  const totalSegments =
    filteredLtvStats.segments.excellent +
    filteredLtvStats.segments.normal +
    filteredLtvStats.segments.dormant +
    filteredLtvStats.segments.at_risk;
  const cumulativeUnitPrice = totalSegments > 0
    ? Math.round(cumulativeRevenue / totalSegments)
    : null;

  const getMomComparison = () => {
    if (allMonthlyData.length < 2) return { lastMonth: null, prevMonth: null };
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

  // 四半期集計
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

  // 年集計
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

  // 月別平均予約間隔
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

  // ヒートマップ
  const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];
  const dowToRow = (dow: number) => (dow === 0 ? 6 : dow - 1);

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
      if (startH < minStart) minStart = startH;
      if (endH > maxEnd) maxEnd = endH;
    }
    if (!hasAny) return { heatmapStartHour: 9, heatmapEndHour: 20 };
    return { heatmapStartHour: minStart, heatmapEndHour: maxEnd };
  })();
  const heatmapHours = Array.from(
    { length: heatmapEndHour - heatmapStartHour + 1 },
    (_, i) => i + heatmapStartHour
  );

  const heatmapGrid: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );
  let maxHeat = 1;
  for (const cell of filteredHeatmapData) {
    const row = dowToRow(cell.day_of_week);
    heatmapGrid[row][cell.hour_of_day] = cell.booking_count;
    if (cell.booking_count > maxHeat) maxHeat = cell.booking_count;
  }

  const maxMenuCount = Math.max(1, ...filteredPopularMenus.map((m) => m.booking_count));

  const hasMultipleYears = (() => {
    const years = new Set(chartMonthly.map((d) => d.month.slice(0, 4)));
    return years.size > 1;
  })();

  const formatTickLabel = (v: string, index: number) => {
    const year = v.slice(0, 4);
    const m = parseInt(v.slice(5, 7));
    if (period === "year") return `${year}年`;
    if (period === "quarter") {
      const q = Math.ceil(m / 3);
      if (index === 0) return `${year}年Q${q}`;
      const prevEntry = chartMonthly[index - 1];
      if (prevEntry && prevEntry.month.slice(0, 4) !== year) return `${year}年Q${q}`;
      return `Q${q}`;
    }
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
    if (period === "year") return `${year}年`;
    if (period === "quarter") {
      const q = Math.ceil(m / 3);
      return `${year}年 第${q}四半期`;
    }
    return `${year}年${m}月`;
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-2xl bg-background p-1.5 ring-1 ring-border">
        <button
          onClick={() => setActiveTab("booking")}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "booking"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
              : "text-muted hover:text-foreground"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            予約実績
          </span>
        </button>
        <button
          onClick={() => setActiveTab("survey")}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "survey"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
              : "text-muted hover:text-foreground"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            アンケート分析
          </span>
        </button>
      </div>

      {/* Shared Filter Area (standard only, visible for both tabs) */}
      {isStandard && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
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
            {(isFilterLoading || surveyAdvancedLoading) && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            )}
          </div>
        </div>
      )}

      {/* Booking Tab */}
      {activeTab === "booking" && (
        <>

          {/* KPI サマリーカード */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiSummaryCard
              icon={<CalendarIcon />}
              label="予約実績"
              value={`${cumulativeBookingCount}件`}
              diff={bookingDiff}
              diffLabel="前月比"
            />
            <KpiSummaryCard
              icon={<CurrencyIcon />}
              label="売上"
              value={`${cumulativeRevenue.toLocaleString()}円`}
              diff={revenueDiff}
              diffLabel="前月比"
              formatDiff={(v) => `${v > 0 ? "+" : ""}${v.toLocaleString()}円`}
            />
            {isStandard && (
              <>
                <KpiSummaryCard
                  icon={<ClockIcon />}
                  label="平均予約間隔"
                  value={filteredAvgBookingInterval.avg_interval_days > 0 ? `${filteredAvgBookingInterval.avg_interval_days}日` : "-"}
                  subText={filteredAvgBookingInterval.customers_with_interval > 0
                    ? `${filteredAvgBookingInterval.customers_with_interval}人のリピーター`
                    : "データなし"
                  }
                />
                <KpiSummaryCard
                  icon={<TagIcon />}
                  label="顧客単価"
                  value={cumulativeUnitPrice !== null ? `${cumulativeUnitPrice.toLocaleString()}円` : "-"}
                  diff={unitPriceDiff}
                  diffLabel="前月比"
                  formatDiff={(v) => `${v > 0 ? "+" : ""}${v.toLocaleString()}円`}
                />
              </>
            )}
          </div>

          {/* 推移グラフ */}
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
                ...(isStandard ? [
                  { key: "interval" as const, label: "平均予約間隔" },
                  { key: "unitPrice" as const, label: "顧客単価" },
                ] : []),
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setChartTab(tab.key as typeof chartTab)}
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

          {/* 人気メニューランキング */}
          <ChartCard title="人気メニューランキング" icon={<StarIcon />}>
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
                            style={{ width: `${barWidth}%` }}
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

          {/* Standard-only sections */}
          {isStandard && (
            <>
              {/* ヒートマップ */}
              <ChartCard title="曜日 x 時間帯 別予約傾向" icon={<GridIcon />}>
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <div className="flex">
                      <div className="w-8" />
                      {heatmapHours.map((h) => (
                        <div key={h} className="flex-1 text-center text-xs text-muted">{h}</div>
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
                                backgroundColor: count > 0
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

              {/* 新規 vs リピーター + キャンセル率 */}
              <div className={`grid gap-4 ${segment === "all" ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
                {segment === "all" && (
                  <ChartCard title="新規 vs リピーター比率" icon={<UsersIcon />}>
                    {(() => {
                      const totalCustomers = filteredAvgBookingInterval.total_customers;
                      const repeaters = filteredAvgBookingInterval.customers_with_interval;
                      const newCustomers = totalCustomers - repeaters;
                      const repeaterPct = totalCustomers > 0 ? Math.round((repeaters / totalCustomers) * 100) : 0;
                      const newPct = totalCustomers > 0 ? 100 - repeaterPct : 0;

                      if (totalCustomers === 0) return <EmptyState />;

                      const circumference = 2 * Math.PI * 40;
                      const newDash = (newPct / 100) * circumference;
                      const repeaterDash = (repeaterPct / 100) * circumference;

                      return (
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                            <svg className="h-36 w-36 -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="12" opacity="0.3" />
                              {newCustomers > 0 && (
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round"
                                  strokeDasharray={`${Math.max(0, newDash - (repeaters > 0 ? 2 : 0))} ${circumference - Math.max(0, newDash - (repeaters > 0 ? 2 : 0))}`}
                                  strokeDashoffset="0" className="transition-all duration-700" />
                              )}
                              {repeaters > 0 && (
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                                  strokeDasharray={`${Math.max(0, repeaterDash - (newCustomers > 0 ? 2 : 0))} ${circumference - Math.max(0, repeaterDash - (newCustomers > 0 ? 2 : 0))}`}
                                  strokeDashoffset={-newDash} className="transition-all duration-700" />
                              )}
                            </svg>
                            <div className="absolute text-center">
                              <span className="text-lg font-bold text-foreground">{totalCustomers}</span>
                              <span className="block text-[10px] text-muted">人</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-3 w-full">
                            <SegmentBar label="新規" count={newCustomers} pct={newPct} color="bg-blue-500" dotColor="bg-blue-500" desc="初めて来店した顧客" />
                            <SegmentBar label="リピーター" count={repeaters} pct={repeaterPct} color="bg-emerald-500" dotColor="bg-emerald-500" desc="2回以上来店した顧客" />
                          </div>
                        </div>
                      );
                    })()}
                  </ChartCard>
                )}

                <ChartCard title="キャンセル率" icon={<CancelIcon />}>
                  {(() => {
                    const totalBookings = filteredMonthlyData.reduce((sum, d) => sum + d.booking_count + d.cancel_count, 0);
                    const totalCancels = filteredMonthlyData.reduce((sum, d) => sum + d.cancel_count, 0);
                    const cancelRate = totalBookings > 0 ? Math.round((totalCancels / totalBookings) * 1000) / 10 : 0;
                    const confirmedCount = totalBookings - totalCancels;

                    if (totalBookings === 0) return <EmptyState />;

                    const getCancelRateColor = (rate: number) => {
                      if (rate <= 5) return { text: "text-emerald-600", hex: "#10b981", label: "とても良い" };
                      if (rate <= 10) return { text: "text-emerald-500", hex: "#34d399", label: "良い" };
                      if (rate <= 20) return { text: "text-amber-500", hex: "#fbbf24", label: "やや高め" };
                      if (rate <= 30) return { text: "text-orange-500", hex: "#fb923c", label: "注意" };
                      return { text: "text-red-500", hex: "#f87171", label: "要改善" };
                    };

                    const rateStyle = getCancelRateColor(cancelRate);
                    const confirmedPct = totalBookings > 0 ? Math.round((confirmedCount / totalBookings) * 100) : 0;
                    const cancelPct = 100 - confirmedPct;

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-background ring-1 ring-border/60">
                            <div className="text-center">
                              <span className={`text-2xl font-bold ${rateStyle.text}`}>{cancelRate}</span>
                              <span className={`block text-xs font-medium ${rateStyle.text} opacity-70`}>%</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-sm text-foreground">
                              全{totalBookings}件中 <span className="font-semibold">{totalCancels}件</span> キャンセル
                            </p>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: `${rateStyle.hex}15`, color: rateStyle.hex }}>
                              {rateStyle.label}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex h-4 overflow-hidden rounded-full bg-border/30">
                            <div className="h-full rounded-l-full bg-emerald-500 transition-all duration-500" style={{ width: `${confirmedPct}%` }} />
                            {cancelPct > 0 && (
                              <div className="h-full rounded-r-full bg-red-400 transition-all duration-500" style={{ width: `${cancelPct}%` }} />
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

              {/* セグメント分布 */}
              {segment === "all" && (
                <ChartCard title="顧客セグメント分布" icon={<UsersIcon />}>
                  {totalSegments > 0 ? (() => {
                    const segmentData = [
                      { key: "excellent", label: "優良", count: filteredLtvStats.segments.excellent, desc: "5回以上来店、定期的に来店" },
                      { key: "normal", label: "通常", count: filteredLtvStats.segments.normal, desc: "2-4回来店、定期的に来店" },
                      { key: "dormant", label: "休眠", count: filteredLtvStats.segments.dormant, desc: "来店間隔が空いている" },
                      { key: "at_risk", label: "離脱リスク", count: filteredLtvStats.segments.at_risk, desc: "1回のみ or 長期間未来店" },
                    ];
                    return (
                      <div className="flex flex-col sm:flex-row items-center gap-6">
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
                                  <circle key={seg.key} cx="50" cy="50" r="40" fill="none" stroke={color.hex} strokeWidth="12" strokeLinecap="round"
                                    strokeDasharray={`${Math.max(0, dashLength - gap)} ${circumference - Math.max(0, dashLength - gap)}`}
                                    strokeDashoffset={-acc.offset} className="transition-all duration-700" />
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
                                      <div className={`h-full rounded-full ${color.bg} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-[11px] text-muted shrink-0">{seg.desc}</span>
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
                </ChartCard>
              )}

              {/* ベンチマーク */}
              <ChartCard title="業界ベンチマーク比較" icon={<BarChartIcon />}>
                {benchmark.available ? (
                  <div className="space-y-4">
                    <p className="text-xs text-muted">同カテゴリ {benchmark.provider_count}事業者の平均との比較</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <BenchmarkCard label="月間予約実績" value={`${benchmark.avg_monthly_bookings}件`} />
                      <BenchmarkCard label="月間売上" value={`${(benchmark.avg_monthly_revenue || 0).toLocaleString()}円`} />
                      <BenchmarkCard label="平均予約間隔" value={benchmark.avg_booking_interval ? `${benchmark.avg_booking_interval}日` : "-"} />
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
            </>
          )}
        </>
      )}

      {/* Survey Tab */}
      {activeTab === "survey" && (
        <SurveyAnalyticsTab
          plan={plan}
          basicStats={surveyBasicStats}
          advancedStats={surveyAdvanced}
          advancedLoading={surveyAdvancedLoading}
          segment={segment}
        />
      )}
    </div>
  );
}

// ============================================================
// Survey trend chart tab type
// ============================================================
type SurveyChartTab = "csat" | "service" | "quality" | "price";

// セグメント補足ラベル
const SEGMENT_DESCRIPTIONS: Record<string, string> = {
  excellent: "常連さん",
  normal: "たまに来店",
  dormant: "最近来ていない",
  at_risk: "1回きり or 長期未来店",
};

// ============================================================
// Survey Analytics Tab Component
// ============================================================

function SurveyAnalyticsTab({
  plan,
  basicStats,
  advancedStats,
  advancedLoading,
  segment,
}: {
  plan: "basic" | "standard";
  basicStats: SurveyBasicStats;
  advancedStats: SurveyAdvancedStats | null;
  advancedLoading: boolean;
  segment: SegmentKey;
}) {
  const isStandard = plan === "standard";
  const [surveyChartTab, setSurveyChartTab] = useState<SurveyChartTab>("csat");

  // Merge csatTrend and driverTrend into a single dataset for unified chart
  const mergedTrendData = advancedStats?.csatTrend.map((ct) => {
    const dt = advancedStats.driverTrend.find((d) => d.month === ct.month);
    return {
      month: ct.month,
      avgCsat: ct.avgCsat,
      responseCount: ct.responseCount,
      avgService: dt?.avgService || 0,
      avgQuality: dt?.avgQuality || 0,
      avgPrice: dt?.avgPrice || 0,
    };
  }) || [];

  const formatSurveyTick = (v: string, index: number) => {
    const year = v.slice(0, 4);
    const m = parseInt(v.slice(5, 7));
    if (index === 0) return `${year}年${m}月`;
    const prevEntry = mergedTrendData[index - 1];
    if (prevEntry && prevEntry.month.slice(0, 4) !== year) return `${year}年${m}月`;
    return `${m}月`;
  };

  const formatSurveyTooltipLabel = (label: unknown) => {
    const str = String(label);
    return `${str.slice(0, 4)}年${parseInt(str.slice(5, 7))}月`;
  };

  // Generate advice
  const advice = (() => {
    if (basicStats.totalResponses === 0) return null;

    // Determine prev month CSAT from trend data
    let prevMonthCsat: number | null = null;
    let prevMonthLabel: string | null = null;
    if (advancedStats && advancedStats.csatTrend.length >= 2) {
      const prevEntry = advancedStats.csatTrend[advancedStats.csatTrend.length - 2];
      prevMonthCsat = prevEntry.avgCsat;
      const m = parseInt(prevEntry.month.slice(5, 7));
      prevMonthLabel = `${m}月`;
    }

    // New vs Repeat
    let newCsat: number | null = null;
    let repeatCsat: number | null = null;
    if (advancedStats?.newVsRepeaterCsat) {
      const newItem = advancedStats.newVsRepeaterCsat.find((x) => x.type === "new");
      const repeatItem = advancedStats.newVsRepeaterCsat.find((x) => x.type === "repeater");
      if (newItem) newCsat = newItem.avgCsat;
      if (repeatItem) repeatCsat = repeatItem.avgCsat;
    }

    // Menu gap
    let menuHighName: string | null = null;
    let menuHighScore: number | null = null;
    let menuLowName: string | null = null;
    let menuLowScore: number | null = null;
    if (advancedStats?.menuCsat && advancedStats.menuCsat.length >= 2) {
      const sorted = [...advancedStats.menuCsat].sort((a, b) => b.avgCsat - a.avgCsat);
      menuHighName = sorted[0].serviceName;
      menuHighScore = sorted[0].avgCsat;
      menuLowName = sorted[sorted.length - 1].serviceName;
      menuLowScore = sorted[sorted.length - 1].avgCsat;
    }

    return generateSurveyAdvice({
      totalResponses: basicStats.totalResponses,
      avgCsat: basicStats.avgCsat,
      prevMonthCsat,
      prevMonthLabel,
      driverService: advancedStats?.driverAverages.service || 0,
      driverQuality: advancedStats?.driverAverages.quality || 0,
      driverPrice: advancedStats?.driverAverages.price || 0,
      newCsat,
      repeatCsat,
      menuHighName,
      menuHighScore,
      menuLowName,
      menuLowScore,
    });
  })();

  // CSAT distribution max for bar width calculation
  const maxDistCount = Math.max(...basicStats.csatDistribution.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiSummaryCard
          icon={<ThumbsUpIcon />}
          label="平均満足度"
          value={basicStats.totalResponses > 0 ? `${basicStats.avgCsat} / 5` : "-"}
          subText={basicStats.totalResponses > 0 ? `${basicStats.totalResponses}件の回答` : "回答なし"}
        />
        <KpiSummaryCard
          icon={<PercentIcon />}
          label="回答率"
          value={basicStats.responseRate > 0 ? `${basicStats.responseRate}%` : "-"}
          subText={basicStats.totalNotifications > 0
            ? `${basicStats.totalNotifications}人中${basicStats.totalResponses}人が回答`
            : "送信数に対する回答数"}
        />
        <KpiSummaryCard
          icon={<ListIcon />}
          label="総回答数"
          value={`${basicStats.totalResponses}件`}
        />
      </div>

      {/* 2. ひとことアドバイス */}
      {advice && (
        <section className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm ring-1 ring-blue-100">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">ひとことアドバイス</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{advice.main}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{advice.sub}</p>
            </div>
          </div>
        </section>
      )}

      {/* 3. 満足度スコア（ゲージバー）*/}
      {basicStats.totalResponses > 0 && (
        <ChartCard title="満足度スコア" icon={<ThumbsUpIcon />}>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-background ring-1 ring-border/60">
              <div className="text-center">
                <span className={`text-2xl font-bold ${getCsatColor(basicStats.avgCsat)}`}>
                  {basicStats.avgCsat}
                </span>
                <span className="block text-xs text-muted">/ 5.0</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex h-3 overflow-hidden rounded-full bg-border/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-700"
                  style={{ width: `${(basicStats.avgCsat / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted">
                {getCsatLabel(basicStats.avgCsat)}
              </p>
            </div>
          </div>
        </ChartCard>
      )}

      {/* 4. 満足度の分布 */}
      {basicStats.totalResponses > 0 && (
        <ChartCard title="満足度の分布" icon={<BarChartIcon />}>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((score) => {
              const item = basicStats.csatDistribution.find((d) => d.score === score);
              const count = item?.count || 0;
              const pct = maxDistCount > 0 ? (count / maxDistCount) * 100 : 0;
              return (
                <div key={score} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 text-right text-sm font-medium text-foreground">{score}点</span>
                  <div className="flex-1 h-5 overflow-hidden rounded-md bg-border/20">
                    <div
                      className={`h-full rounded-md transition-all duration-700 ${
                        score >= 4 ? "bg-emerald-400" : score === 3 ? "bg-amber-400" : "bg-red-300"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-xs text-muted">{count}件</span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}

      {/* Standard-only: Advanced Survey Analytics */}
      {isStandard ? (
        advancedLoading ? (
          <div className="flex flex-col items-center py-12 text-muted">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-accent border-t-transparent" />
            <p className="mt-3 text-sm">詳細分析データを読み込み中...</p>
          </div>
        ) : advancedStats ? (
          <>
            {/* 5. お客さんの評価の内訳（接客/品質/価格） */}
            <ChartCard title="お客さんの評価の内訳" icon={<BarChartIcon />}>
              {advancedStats.driverAverages.service > 0 || advancedStats.driverAverages.quality > 0 || advancedStats.driverAverages.price > 0 ? (
                <div className="space-y-4">
                  <DriverScoreBar label="接客・対応" score={advancedStats.driverAverages.service} color="#3b82f6" />
                  <DriverScoreBar label="品質・仕上がり" score={advancedStats.driverAverages.quality} color="#10b981" />
                  <DriverScoreBar label="価格" score={advancedStats.driverAverages.price} color="#f59e0b" />
                </div>
              ) : (
                <EmptyState />
              )}
            </ChartCard>

            {/* 6. 満足度の推移（タブ切替グラフ） */}
            {mergedTrendData.length > 0 && (
              <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/60">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <TrendIcon />
                    <h3 className="text-sm font-semibold text-foreground">満足度の推移</h3>
                  </div>
                </div>

                {/* Chart tab switcher */}
                <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-background p-1 ring-1 ring-border">
                  {([
                    { key: "csat" as const, label: "総合" },
                    { key: "service" as const, label: "接客" },
                    { key: "quality" as const, label: "品質" },
                    { key: "price" as const, label: "価格" },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSurveyChartTab(tab.key)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        surveyChartTab === tab.key
                          ? "bg-accent text-white shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {(() => {
                  const chartColor =
                    surveyChartTab === "csat" ? "var(--accent)" :
                    surveyChartTab === "service" ? "#3b82f6" :
                    surveyChartTab === "quality" ? "#10b981" :
                    "#f59e0b";
                  const chartDataKey =
                    surveyChartTab === "csat" ? "avgCsat" :
                    surveyChartTab === "service" ? "avgService" :
                    surveyChartTab === "quality" ? "avgQuality" :
                    "avgPrice";
                  const tooltipName =
                    surveyChartTab === "csat" ? "平均満足度" :
                    surveyChartTab === "service" ? "接客" :
                    surveyChartTab === "quality" ? "品質" : "価格";

                  return (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={mergedTrendData}>
                        <defs>
                          <linearGradient id="surveyChartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                        <XAxis
                          dataKey="month"
                          tickFormatter={formatSurveyTick}
                          fontSize={12}
                          stroke="var(--color-muted)"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[1, 5]}
                          fontSize={12}
                          stroke="var(--color-muted)"
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}`, tooltipName]}
                          labelFormatter={formatSurveyTooltipLabel}
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
                          stroke={chartColor}
                          strokeWidth={2.5}
                          fill="url(#surveyChartGradient)"
                          dot={{ r: 4, fill: "var(--card)", stroke: chartColor, strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: chartColor, stroke: "var(--card)", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  );
                })()}
              </section>
            )}

            {/* 7. メニュー別 満足度 - Card layout with stars */}
            {advancedStats.menuCsat.length > 0 && (
              <ChartCard title="メニュー別 満足度" icon={<StarIcon />}>
                <div className="space-y-3">
                  {[...advancedStats.menuCsat]
                    .sort((a, b) => b.avgCsat - a.avgCsat)
                    .map((menu, index) => {
                      const csatPct = (menu.avgCsat / 5) * 100;
                      const barColor = menu.avgCsat >= 4.0
                        ? "bg-emerald-500" : menu.avgCsat >= 3.0
                        ? "bg-amber-400" : "bg-red-400";
                      const bgColor = menu.avgCsat >= 4.0
                        ? "bg-emerald-50" : menu.avgCsat >= 3.0
                        ? "bg-amber-50" : "bg-red-50";
                      const hint = index === 0 && advancedStats.menuCsat.length > 1
                        ? "最も高評価のメニューです"
                        : menu.avgCsat < 3.0
                        ? "改善の余地があります"
                        : menu.avgCsat >= 4.5
                        ? "非常に高い満足度です"
                        : null;

                      return (
                        <div key={menu.serviceId} className={`rounded-xl ${bgColor} p-4`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{menu.serviceName}</p>
                              <div className="mt-1 flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill={star <= Math.round(menu.avgCsat) ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className={star <= Math.round(menu.avgCsat) ? "text-amber-400" : "text-border"}
                                  >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                ))}
                                <span className={`ml-1.5 text-sm font-bold ${getCsatColor(menu.avgCsat)}`}>{menu.avgCsat} / 5</span>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-xs text-muted">{menu.responseCount}件</span>
                            </div>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/60">
                            <div
                              className={`h-full rounded-full ${barColor} transition-all duration-700`}
                              style={{ width: `${csatPct}%` }}
                            />
                          </div>
                          {hint && (
                            <p className="mt-1.5 text-[11px] text-muted">{hint}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </ChartCard>
            )}

            {/* 8. メニュー診断（4象限） */}
            {advancedStats.menuCsatMatrix.length > 0 && (
              <ChartCard title="メニュー診断" icon={<GridIcon />}>
                <p className="mb-4 text-xs text-muted">各メニューの人気度(予約数)と満足度を4象限で診断します</p>
                {(() => {
                  const matrix = advancedStats.menuCsatMatrix;
                  const avgCsatAll = matrix.reduce((s, m) => s + m.avgCsat, 0) / matrix.length;
                  const avgBookings = matrix.reduce((s, m) => s + m.bookingCount, 0) / matrix.length;

                  return (
                    <div className="space-y-4">
                      {/* Quadrant labels */}
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-muted">
                        <div className="rounded-lg bg-amber-50 p-2">
                          <p className="font-semibold text-amber-700">伸びしろメニュー</p>
                          <p>人気だが改善余地あり</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2">
                          <p className="font-semibold text-emerald-700">看板メニュー</p>
                          <p>人気+高評価</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-2">
                          <p className="font-semibold text-red-700">見直し候補</p>
                          <p>予約も評価も低め</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-2">
                          <p className="font-semibold text-blue-700">隠れた良メニュー</p>
                          <p>評価は高いが予約少なめ</p>
                        </div>
                      </div>

                      {/* Menu items positioned in quadrants */}
                      <div className="space-y-2">
                        {matrix.map((m) => {
                          const isHighCsat = m.avgCsat >= avgCsatAll;
                          const isHighBooking = m.bookingCount >= avgBookings;
                          const quadrantColor = isHighCsat && isHighBooking ? "border-emerald-300 bg-emerald-50"
                            : isHighCsat && !isHighBooking ? "border-blue-300 bg-blue-50"
                            : !isHighCsat && isHighBooking ? "border-amber-300 bg-amber-50"
                            : "border-red-300 bg-red-50";
                          const textColor = isHighCsat && isHighBooking ? "text-emerald-700"
                            : isHighCsat && !isHighBooking ? "text-blue-700"
                            : !isHighCsat && isHighBooking ? "text-amber-700"
                            : "text-red-700";
                          const quadrantLabel = isHighCsat && isHighBooking ? "看板メニュー"
                            : isHighCsat && !isHighBooking ? "隠れた良メニュー"
                            : !isHighCsat && isHighBooking ? "伸びしろメニュー"
                            : "見直し候補";

                          return (
                            <div key={m.serviceId} className={`flex items-center justify-between rounded-xl border p-3 ${quadrantColor}`}>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${textColor}`}>{m.serviceName}</p>
                                <p className="text-[10px] text-muted mt-0.5">{quadrantLabel}</p>
                              </div>
                              <div className="flex items-center gap-4 shrink-0 ml-3">
                                <div className="text-center">
                                  <p className="text-xs text-muted">予約数</p>
                                  <p className="text-sm font-bold">{m.bookingCount}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted">満足度</p>
                                  <p className={`text-sm font-bold ${getCsatColor(m.avgCsat)}`}>{m.avgCsat}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </ChartCard>
            )}

            {/* 9. 初めてのお客さん vs リピーターの満足度 */}
            {advancedStats.newVsRepeaterCsat.length > 0 && (
              <ChartCard title="初めてのお客さん vs リピーターの満足度" icon={<UsersIcon />}>
                <p className="mb-4 text-xs text-muted">初回来店のお客さんとリピーターの満足度を比較します</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {advancedStats.newVsRepeaterCsat.map((item) => {
                    const isNew = item.type === "new";
                    return (
                      <div key={item.type} className={`rounded-xl p-5 ${isNew ? "bg-blue-50" : "bg-emerald-50"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isNew ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                            {isNew ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isNew ? "text-blue-700" : "text-emerald-700"}`}>{item.label}</p>
                            <p className="text-xs text-muted">{item.count}件の回答</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-end gap-2">
                          <span className={`text-3xl font-bold ${getCsatColor(item.avgCsat)}`}>{item.avgCsat}</span>
                          <span className="mb-1 text-sm text-muted">/ 5.0</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/60">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${isNew ? "bg-blue-400" : "bg-emerald-400"}`}
                            style={{ width: `${(item.avgCsat / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            )}

            {/* 10. お客さんのタイプ別 満足度 */}
            {segment === "all" && advancedStats.segmentCsat.length > 0 && (
              <ChartCard title="お客さんのタイプ別 満足度" icon={<UsersIcon />}>
                <div className="space-y-3">
                  {advancedStats.segmentCsat.map((seg, i) => {
                    const desc = SEGMENT_DESCRIPTIONS[seg.segment] || "";
                    return (
                      <div key={seg.segment} className="flex items-center gap-3">
                        <div className={`h-3 w-3 shrink-0 rounded-full ${SEGMENT_COLORS[i % SEGMENT_COLORS.length].bg}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{seg.segmentLabel}</p>
                              {desc && <p className="text-[10px] text-muted">{desc}</p>}
                            </div>
                            <div className="ml-2 flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted">{seg.responseCount}件</span>
                              <span className={`text-sm font-bold ${getCsatColor(seg.avgCsat)}`}>{seg.avgCsat} / 5</span>
                            </div>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border/30">
                            <div
                              className={`h-full rounded-full ${SEGMENT_COLORS[i % SEGMENT_COLORS.length].bg} transition-all duration-500`}
                              style={{ width: `${(seg.avgCsat / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            )}

            {/* 11. 年代別 満足度 */}
            {advancedStats.ageCsat.length > 0 && (
              <ChartCard title="年代別 満足度" icon={<UsersIcon />}>
                <ResponsiveContainer width="100%" height={Math.max(150, advancedStats.ageCsat.length * 50)}>
                  <BarChart data={advancedStats.ageCsat} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} fontSize={12} stroke="var(--color-muted)" axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="ageGroup" fontSize={11} stroke="var(--color-muted)" axisLine={false} tickLine={false} width={50} />
                    <Tooltip
                      formatter={(value, _name, props) => [`${value} / 5 (${props.payload.count}件)`, "平均満足度"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "13px" }}
                    />
                    <Bar dataKey="avgCsat" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </>
        ) : null
      ) : (
        /* Basic plan: show upgrade prompt for advanced features */
        <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border/60">
          <p className="text-sm font-semibold">スタンダードプランでさらに詳しい分析が見れます</p>
          <p className="mt-1 text-xs text-muted">
            満足度の推移・評価の内訳分析・メニュー診断・お客さんのタイプ別分析が利用できます
          </p>
          <a
            href="/provider/billing"
            className="mt-3 inline-block rounded-xl bg-accent px-6 py-2 text-sm font-semibold text-white"
          >
            スタンダードにアップグレード
          </a>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Helper Components
// ============================================================

function DriverScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <p className="w-24 shrink-0 text-sm font-medium">{label}</p>
      <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-border/30">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / 5) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-bold" style={{ color }}>
        {score > 0 ? score : "-"}
      </span>
    </div>
  );
}

function SegmentBar({ label, count, pct, color, dotColor, desc }: {
  label: string; count: number; pct: number; color: string; dotColor: string; desc: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-3 w-3 shrink-0 rounded-full ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium">{label}</p>
          <div className="ml-2 shrink-0 flex items-center gap-2">
            <span className="text-xs text-muted">{count}人</span>
            <span className="text-xs font-semibold text-foreground">{pct}%</span>
          </div>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border/30">
          <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-0.5 text-[11px] text-muted">{desc}</p>
      </div>
    </div>
  );
}

function getCsatColor(csat: number): string {
  if (csat >= 4) return "text-emerald-600";
  if (csat >= 3) return "text-amber-600";
  return "text-red-500";
}

function getCsatLabel(csat: number): string {
  if (csat >= 4.5) return "非常に高い評価です";
  if (csat >= 4.0) return "高い評価です";
  if (csat >= 3.0) return "平均的な評価です";
  if (csat >= 2.0) return "改善の余地があります";
  return "要改善です";
}

function ChartCard({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
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
  icon, label, value, diff, diffLabel, subText, invertColor, formatDiff,
}: {
  icon: React.ReactNode; label: string; value: string;
  diff?: number | null; diffLabel?: string; subText?: string;
  invertColor?: boolean; formatDiff?: (v: number) => string;
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
      {diff !== null && diff !== undefined && (
        <p className={`mt-1 text-xs font-medium ${getDiffColor(diff)}`}>
          <span className="inline-flex items-center gap-0.5">
            {diff > 0 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
            ) : diff < 0 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
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

function BenchmarkCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background p-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1.5 text-lg font-bold">{value}</p>
    </div>
  );
}

// ============================================================
// Icon Components (extracted to reduce duplication)
// ============================================================

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function PercentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
