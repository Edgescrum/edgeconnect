"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

export function AnalyticsClient({
  monthlyStats,
  popularMenus,
  heatmapData,
  repeatRate,
  ltvStats,
  benchmark,
}: {
  monthlyStats: MonthlyStat[];
  popularMenus: PopularMenu[];
  heatmapData: HeatmapCell[];
  repeatRate: RepeatRate;
  ltvStats: LtvStats;
  benchmark: Benchmark;
}) {
  const chartMonthly = monthlyStats.map((s) => ({
    month: s.month.slice(5),
    bookings: s.booking_count,
    revenue: s.revenue,
    cancelRate: s.cancel_rate,
  }));

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

  return (
    <div className="space-y-6">
      {/* 1. 月間予約数推移 */}
      <ChartCard title="月間予約数推移（過去6ヶ月）">
        {chartMonthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="month"
                tickFormatter={(v) => `${parseInt(v)}月`}
                fontSize={12}
                stroke="var(--color-muted)"
              />
              <YAxis allowDecimals={false} fontSize={12} stroke="var(--color-muted)" />
              <Tooltip
                formatter={(value) => [`${value}件`, "予約数"]}
                labelFormatter={(label) => `${parseInt(label)}月`}
              />
              <Bar dataKey="bookings" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </ChartCard>

      {/* 2+3. 月間売上 + キャンセル率 */}
      <div className="grid gap-6 sm:grid-cols-2">
        <ChartCard title="月間売上推移">
          {chartMonthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => `${parseInt(v)}月`}
                  fontSize={12}
                  stroke="var(--color-muted)"
                />
                <YAxis fontSize={12} stroke="var(--color-muted)" />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()}円`, "売上"]}
                  labelFormatter={(label) => `${parseInt(label)}月`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="キャンセル率推移">
          {chartMonthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => `${parseInt(v)}月`}
                  fontSize={12}
                  stroke="var(--color-muted)"
                />
                <YAxis unit="%" fontSize={12} stroke="var(--color-muted)" />
                <Tooltip
                  formatter={(value) => [`${value}%`, "キャンセル率"]}
                  labelFormatter={(label) => `${parseInt(label)}月`}
                />
                <Line
                  type="monotone"
                  dataKey="cancelRate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>
      </div>

      {/* 4. 人気メニューランキング */}
      <ChartCard title="人気メニューランキング">
        {popularMenus.length > 0 ? (
          <div className="space-y-3">
            {popularMenus.map((m, i) => (
              <div key={m.service_id} className="flex items-center gap-3">
                <span className="w-5 text-right text-sm font-bold text-muted">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium truncate">{m.service_name}</p>
                    <span className="ml-2 shrink-0 text-sm text-muted">{m.booking_count}件</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent"
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
      <ChartCard title="曜日 x 時間帯 別予約傾向">
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
                      className="m-0.5 flex flex-1 items-center justify-center rounded text-xs"
                      style={{
                        height: 28,
                        backgroundColor:
                          count > 0
                            ? `rgba(99, 102, 241, ${0.1 + intensity * 0.8})`
                            : "var(--color-background)",
                        color: intensity > 0.5 ? "white" : "var(--color-muted)",
                      }}
                      title={`${day} ${h}時: ${count}件`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* 6+7. リピート率 + 平均LTV */}
      <div className="grid gap-6 sm:grid-cols-2">
        <ChartCard title="リピート率">
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10">
              <span className="text-3xl font-bold text-accent">
                {repeatRate.repeat_rate}%
              </span>
            </div>
            <div className="text-sm text-muted">
              <p>
                全顧客数: <span className="font-semibold text-foreground">{repeatRate.total_customers}人</span>
              </p>
              <p className="mt-1">
                リピーター: <span className="font-semibold text-foreground">{repeatRate.repeat_customers}人</span>
              </p>
              <p className="mt-1 text-xs">2回以上来店した顧客の割合</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="平均LTV（顧客生涯価値）">
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10">
              <span className="text-2xl font-bold text-accent">
                {Math.round(ltvStats.avg_ltv).toLocaleString()}
                <span className="text-sm">円</span>
              </span>
            </div>
            <div className="text-sm text-muted">
              <p>顧客1人あたりの平均累計売上</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* 8. 顧客セグメント分布 */}
      <ChartCard title="顧客セグメント分布">
        {totalSegments > 0 ? (
          <div className="space-y-3">
            <SegmentBar
              label="優良"
              count={ltvStats.segments.excellent}
              total={totalSegments}
              color="bg-green-500"
              desc="5回以上来店、定期的に来店"
            />
            <SegmentBar
              label="通常"
              count={ltvStats.segments.normal}
              total={totalSegments}
              color="bg-blue-500"
              desc="2-4回来店、定期的に来店"
            />
            <SegmentBar
              label="休眠"
              count={ltvStats.segments.dormant}
              total={totalSegments}
              color="bg-yellow-500"
              desc="来店間隔が空いている"
            />
            <SegmentBar
              label="離脱リスク"
              count={ltvStats.segments.at_risk}
              total={totalSegments}
              color="bg-red-500"
              desc="1回のみ or 長期間未来店"
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </ChartCard>

      {/* 9. 業界ベンチマーク */}
      <ChartCard title="業界ベンチマーク比較">
        {benchmark.available ? (
          <div className="space-y-4">
            <p className="text-xs text-muted">
              同カテゴリ {benchmark.provider_count}事業者の平均との比較
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <BenchmarkCard
                label="月間予約数（平均）"
                value={`${benchmark.avg_monthly_bookings}件`}
              />
              <BenchmarkCard
                label="月間売上（平均）"
                value={`${(benchmark.avg_monthly_revenue || 0).toLocaleString()}円`}
              />
              <BenchmarkCard
                label="リピート率（平均）"
                value={`${benchmark.avg_repeat_rate}%`}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            同カテゴリの事業者が5件以上になると、ベンチマーク比較が表示されます
            {benchmark.provider_count > 0 && `（現在 ${benchmark.provider_count}件）`}
          </p>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <h3 className="mb-4 text-sm font-semibold text-muted">{title}</h3>
      {children}
    </section>
  );
}

function EmptyState() {
  return <p className="py-4 text-center text-sm text-muted">データがありません</p>;
}

function SegmentBar({
  label,
  count,
  total,
  color,
  desc,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  desc: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${color}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted">
          {count}人（{pct}%）
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-0.5 text-xs text-muted">{desc}</p>
    </div>
  );
}

function BenchmarkCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
