"use client";

import { useState } from "react";
import { toggleServicePublished, deleteService } from "@/lib/actions/service";

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

  async function handleDelete(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    setError(null);
    setLoadingId(id);
    try {
      await deleteService(id);
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
          <div
            key={service.id}
            className={`rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border ${
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
                  <p className="mt-1 text-xs text-muted">
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
                  <span className="text-xs text-muted">
                    キャンセル{service.cancel_deadline_hours}h前まで
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <button
                onClick={() => handleToggle(service.id, service.is_published)}
                disabled={loadingId === service.id}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  service.is_published
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-muted"
                }`}
              >
                {service.is_published ? "公開中" : "非公開"}
              </button>
              <a
                href={`/provider/services/${service.id}/edit`}
                className="rounded-lg bg-accent-bg px-3 py-1.5 text-xs font-medium text-accent"
              >
                編集
              </a>
              <button
                onClick={() => handleDelete(service.id, service.name)}
                disabled={loadingId === service.id}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
