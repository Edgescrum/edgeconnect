"use client";

interface DashboardSummaryProps {
  bookingCount: number;
  revenue: number;
  bookingCountDiff: number | null;
  revenueDiff: number | null;
}

export function DashboardSummary({
  bookingCount,
  revenue,
  bookingCountDiff,
  revenueDiff,
}: DashboardSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SummaryCard
        label="今月の予約数"
        value={`${bookingCount}件`}
        diff={bookingCountDiff}
        unit="件"
      />
      <SummaryCard
        label="売上見込み"
        value={`${revenue.toLocaleString()}円`}
        diff={revenueDiff}
        unit="円"
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  diff,
  unit,
}: {
  label: string;
  value: string;
  diff: number | null;
  unit: string;
}) {
  const isPositive = diff !== null && diff > 0;
  const isNegative = diff !== null && diff < 0;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-accent/5 to-accent/10 p-4 ring-1 ring-accent/20">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {diff !== null && (
        <p
          className={`mt-1 text-xs font-medium ${
            isPositive
              ? "text-green-600"
              : isNegative
                ? "text-red-500"
                : "text-muted"
          }`}
        >
          {isPositive ? "↑" : isNegative ? "↓" : "→"}
          {" "}
          前月比 {Math.abs(diff).toLocaleString()}
          {unit}
        </p>
      )}
    </div>
  );
}
