"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getCustomers } from "@/lib/actions/customer";

interface Customer {
  customer_user_id: number;
  display_name: string | null;
  customer_name: string | null;
  booking_count: number;
  last_visit_date: string | null;
  last_menu_name: string | null;
  days_since_last_visit: number | null;
}

const FILTERS = [
  { value: "all", label: "全員" },
  { value: "1month", label: "1ヶ月以上未来店" },
  { value: "3months", label: "3ヶ月以上未来店" },
];

export function CustomersClient({
  initialCustomers,
}: {
  initialCustomers: Customer[];
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  function handleSearch(q: string, f: string) {
    setQuery(q);
    setFilter(f);
    startTransition(async () => {
      try {
        const data = await getCustomers(q, f);
        setCustomers(data);
      } catch {
        // エラー時は現在のデータを保持
      }
    });
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }

  return (
    <div>
      {/* 検索バー */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="名前で検索"
            value={query}
            onChange={(e) => handleSearch(e.target.value, filter)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleSearch(query, f.value)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-accent text-white"
                  : "bg-card text-muted ring-1 ring-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 顧客リスト */}
      <div className="mt-4 space-y-2">
        {isPending && (
          <div className="py-4 text-center text-sm text-muted">読み込み中...</div>
        )}
        {!isPending && customers.length === 0 && (
          <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-border">
            <p className="text-sm text-muted">
              {query || filter !== "all"
                ? "条件に一致する顧客が見つかりません"
                : "まだ顧客がいません。予約が入ると自動で追加されます"}
            </p>
          </div>
        )}
        {!isPending &&
          customers.map((c) => (
            <Link
              key={c.customer_user_id}
              href={`/provider/customers/${c.customer_user_id}`}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-border active:scale-[0.99] hover:ring-accent/30 transition-all"
            >
              {/* アバター */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {(c.customer_name || c.display_name || "?")[0]}
              </div>
              {/* 情報 */}
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold">
                  {c.customer_name || c.display_name || "不明"}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span>来店 {c.booking_count}回</span>
                  <span>最終 {formatDate(c.last_visit_date)}</span>
                  {c.last_menu_name && <span>{c.last_menu_name}</span>}
                </div>
              </div>
              {/* 警告バッジ */}
              {c.days_since_last_visit !== null && c.days_since_last_visit >= 90 && (
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {c.days_since_last_visit}日前
                </span>
              )}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-muted"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          ))}
      </div>
    </div>
  );
}
