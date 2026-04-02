"use client";

import { useState } from "react";
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
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleToggle(id: number, current: boolean) {
    setError(null);
    setLoadingId(id);
    try {
      await toggleServicePublished(id, !current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoadingId(null);
    }
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
          <a
            key={service.id}
            href={`/provider/services/${service.id}/edit`}
            className={`block rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99] ${
              !service.is_published ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{service.name}</p>
                  {!service.is_published && (
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
                    handleToggle(service.id, service.is_published);
                  }}
                  disabled={loadingId === service.id}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                    service.is_published ? "bg-success" : "bg-gray-300"
                  }`}
                  aria-label={
                    service.is_published ? "公開中（タップで非公開）" : "非公開（タップで公開）"
                  }
                >
                  {loadingId === service.id ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </span>
                  ) : (
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                        service.is_published
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  )}
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
          </a>
        ))}
      </div>
    </div>
  );
}
