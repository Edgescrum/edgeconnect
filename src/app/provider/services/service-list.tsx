"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleServicePublished } from "@/lib/actions/service";

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_min: number;
  price: number;
  is_published: boolean;
  cancel_deadline_hours: number;
}

export function ServiceList({ services }: { services: Service[] }) {
  const [error, setError] = useState<string | null>(null);
  // 楽観的更新: トグル即座に切り替え、失敗時に戻す
  const [optimisticState, setOptimisticState] = useState<Record<number, boolean>>({});

  async function handleToggle(id: number, current: boolean) {
    setError(null);
    setOptimisticState((prev) => ({ ...prev, [id]: !current }));
    try {
      await toggleServicePublished(id, !current);
    } catch (e) {
      setOptimisticState((prev) => ({ ...prev, [id]: current }));
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    }
  }

  function isPublished(service: Service) {
    return optimisticState[service.id] ?? service.is_published;
  }

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {services.map((service) => (
          <Link
            key={service.id}
            href={`/provider/services/${service.id}/edit`}
            className={`block rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99] transition-opacity ${
              !isPublished(service) ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{service.name}</p>
                  {!isPublished(service) && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted">
                      非公開
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="mt-1 text-xs text-muted line-clamp-1">
                    {service.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <span className="font-bold">
                    ¥{service.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted">
                    {service.duration_min}分
                  </span>
                </div>
              </div>

              {/* Toggle + Chevron */}
              <div className="ml-3 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggle(service.id, isPublished(service));
                  }}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
                    isPublished(service) ? "bg-success" : "bg-gray-300"
                  }`}
                  aria-label={
                    isPublished(service) ? "公開中（タップで非公開）" : "非公開（タップで公開）"
                  }
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                      isPublished(service)
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
