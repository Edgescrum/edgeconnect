"use client";

import { useState } from "react";
import Link from "next/link";
import type { SurveyGroup } from "@/lib/actions/survey";
import { ProviderAvatar } from "@/components/ProviderAvatar";

function StatusBadge({ status }: { status: "pending" | "completed" | "expired" }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
        回答済み
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-accent-bg px-2.5 py-0.5 text-xs font-medium text-accent">
      未回答
    </span>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill={i <= rating ? "#f59e0b" : "#e5e7eb"}
          stroke="none"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]}) ${d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatExpiry(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}まで`;
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function SurveyPortalClient({ groups }: { groups: SurveyGroup[] }) {
  const [tab, setTab] = useState<"pending" | "completed">("pending");

  const pendingCount = groups.reduce(
    (sum, g) => sum + g.surveys.filter((s) => s.status === "pending").length,
    0
  );
  const completedCount = groups.reduce(
    (sum, g) => sum + g.surveys.filter((s) => s.status === "completed").length,
    0
  );

  // Filter groups based on selected tab
  const filteredGroups = groups
    .map((g) => ({
      ...g,
      surveys: g.surveys.filter((s) => s.status === tab),
    }))
    .filter((g) => g.surveys.length > 0);

  const isEmpty = filteredGroups.length === 0;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setTab("pending")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "pending"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          未回答
          {pendingCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "completed"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          回答済み
          {completedCount > 0 && (
            <span className="ml-1.5 text-xs text-muted">({completedCount})</span>
          )}
        </button>
      </div>

      {isEmpty && tab === "pending" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
              <path d="M9 11l3 3L22 4" />
            </svg>
          </div>
          <p className="font-semibold">未回答のアンケートはありません</p>
          <p className="mt-1 text-sm text-muted">新しいアンケートが届くとここに表示されます</p>
        </div>
      )}

      {isEmpty && tab === "completed" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
          </div>
          <p className="font-semibold">回答済みのアンケートはありません</p>
          <p className="mt-1 text-sm text-muted">アンケートに回答するとここに表示されます</p>
        </div>
      )}

      {tab === "pending" && !isEmpty && (
        <p className="text-sm text-muted">
          回答待ちのアンケートがあります。タップして回答してください。
        </p>
      )}

      {filteredGroups.map((group) => (
        <div key={group.providerSlug} className="space-y-3">
          {/* Provider header */}
          <div className="flex items-center gap-3">
            <ProviderAvatar
              name={group.providerName}
              iconUrl={group.providerIconUrl}
              size={36}
            />
            <h2 className="text-sm font-semibold">{group.providerName}</h2>
          </div>

          {/* Survey cards */}
          <div className="space-y-2">
            {group.surveys.map((survey) => {
              const isPending = survey.status === "pending";

              if (isPending) {
                return (
                  <Link key={survey.bookingId} href={`/survey/${survey.bookingId}`}>
                    <div className="rounded-xl border border-accent/20 bg-card p-4 transition-colors hover:border-accent/40 active:bg-accent-bg cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{survey.serviceName}</p>
                          <p className="text-xs text-muted">
                            {formatDate(survey.startAt)}
                          </p>
                          <p className="text-xs text-accent">
                            回答期限: {formatExpiry(survey.expiresAt)}
                          </p>
                        </div>
                        <StatusBadge status={survey.status} />
                      </div>
                    </div>
                  </Link>
                );
              }

              // Completed - show summary (link to read-only detail view)
              return (
                <Link key={survey.bookingId} href={`/survey/${survey.bookingId}`}>
                  <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-gray-300 active:bg-gray-50 cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{survey.serviceName}</p>
                        <p className="text-xs text-muted">
                          {formatDate(survey.startAt)}
                        </p>
                        {survey.responseCsat && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <StarDisplay rating={survey.responseCsat} />
                            <span className="text-xs text-muted">
                              {survey.respondedAt && `${formatShortDate(survey.respondedAt)} 回答`}
                            </span>
                          </div>
                        )}
                      </div>
                      <StatusBadge status={survey.status} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
