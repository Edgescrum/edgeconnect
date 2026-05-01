"use client";

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
  if (status === "expired") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
        期限切れ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-accent-bg px-2.5 py-0.5 text-xs font-medium text-accent">
      未回答
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

export function SurveyPortalClient({ groups }: { groups: SurveyGroup[] }) {
  const hasPending = groups.some((g) => g.surveys.some((s) => s.status === "pending"));

  if (groups.length === 0 || !groups.some((g) => g.surveys.length > 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-4xl">&#x1F4DD;</div>
        <p className="text-sm text-muted">回答待ちのアンケートはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasPending && (
        <p className="text-sm text-muted">
          回答待ちのアンケートがあります。タップして回答してください。
        </p>
      )}

      {groups.map((group) => (
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
              const card = (
                <div
                  className={`rounded-xl border bg-card p-4 transition-colors ${
                    isPending
                      ? "border-accent/20 hover:border-accent/40 active:bg-accent-bg cursor-pointer"
                      : "border-border opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{survey.serviceName}</p>
                      <p className="text-xs text-muted">
                        {formatDate(survey.startAt)}
                      </p>
                      {survey.status === "pending" && (
                        <p className="text-xs text-accent">
                          回答期限: {formatExpiry(survey.expiresAt)}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={survey.status} />
                  </div>
                </div>
              );

              if (isPending) {
                return (
                  <Link key={survey.bookingId} href={`/survey/${survey.bookingId}`}>
                    {card}
                  </Link>
                );
              }

              return <div key={survey.bookingId}>{card}</div>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
