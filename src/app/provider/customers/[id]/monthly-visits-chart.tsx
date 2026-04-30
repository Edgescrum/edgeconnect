"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyVisit {
  month: string;
  visit_count: number;
}

export function MonthlyVisitsChart({ data }: { data: MonthlyVisit[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">データがありません</p>;
  }

  const chartData = data.map((d) => ({
    month: d.month.slice(5), // "YYYY-MM" -> "MM"
    visits: d.visit_count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          tickFormatter={(v) => `${parseInt(v)}月`}
          fontSize={12}
          stroke="var(--color-muted)"
        />
        <YAxis
          allowDecimals={false}
          fontSize={12}
          stroke="var(--color-muted)"
        />
        <Tooltip
          formatter={(value) => [`${value}回`, "来店数"]}
          labelFormatter={(label) => `${parseInt(label)}月`}
        />
        <Bar dataKey="visits" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
