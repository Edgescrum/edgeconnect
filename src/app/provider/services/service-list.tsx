"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { toggleServicePublished, reorderServices } from "@/lib/actions/service";
import { Toggle } from "@/components/Toggle";

interface Service {
  id: number;
  name: string;
  duration_min: number;
  price: number;
  is_published: boolean;
  cancel_deadline_hours: number;
  sort_order: number;
}

function DragIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function UnpublishedBadge() {
  return (
    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted">
      非公開
    </span>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ServiceList({ services: initialServices }: { services: Service[] }) {
  const [services, setServices] = useState(initialServices);
  const [error, setError] = useState<string | null>(null);
  const [optimisticState, setOptimisticState] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  // ドラッグ状態
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const touchStartY = useRef(0);
  const touchCurrentItem = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  // --- ドラッグ&ドロップ (mouse) ---
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setOverIndex(index);
  }

  function handleDragEnd() {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      reorder(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  // --- タッチドラッグ ---
  function handleTouchStart(e: React.TouchEvent, index: number) {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentItem.current = index;
    setDragIndex(index);
  }

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchCurrentItem.current === null || !listRef.current) return;
      const y = e.touches[0].clientY;
      const items = listRef.current.querySelectorAll("[data-sortable]");
      for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) {
          setOverIndex(i);
          break;
        }
      }
    },
    []
  );

  function handleTouchEnd() {
    if (touchCurrentItem.current !== null && overIndex !== null && touchCurrentItem.current !== overIndex) {
      reorder(touchCurrentItem.current, overIndex);
    }
    touchCurrentItem.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }

  async function reorder(fromIndex: number, toIndex: number) {
    const updated = [...services];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setServices(updated);

    setSaving(true);
    setError(null);
    try {
      await reorderServices(updated.map((s) => s.id));
    } catch (e) {
      setServices(initialServices);
      setError(e instanceof Error ? e.message : "並び替えに失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {saving && (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          並び順を保存中...
        </div>
      )}

      {/* --- モバイル版: カードリスト --- */}
      <div ref={listRef} className="space-y-3 sm:hidden">
        {services.map((service, index) => (
          <div
            key={service.id}
            data-sortable
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 transition-opacity ${
              dragIndex === index ? "opacity-50" : ""
            } ${
              overIndex === index && dragIndex !== index ? "ring-2 ring-accent rounded-2xl" : ""
            }`}
          >
            <div
              className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded-lg p-1.5 text-muted active:cursor-grabbing"
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <DragIcon />
            </div>
            <Link
              href={`/provider/services/${service.id}/edit`} prefetch={false}
              className={`block flex-1 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99] transition-opacity ${
                !isPublished(service) ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{service.name}</p>
                    {!isPublished(service) && <UnpublishedBadge />}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="font-bold">¥{service.price.toLocaleString()}</span>
                    <span className="text-xs text-muted">{service.duration_min}分</span>
                  </div>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <Toggle
                      checked={isPublished(service)}
                      onChange={() => handleToggle(service.id, isPublished(service))}
                      ariaLabel={isPublished(service) ? "公開中" : "非公開"}
                    />
                  </div>
                  <ChevronIcon />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* --- PC版: テーブル風 --- */}
      <div className="hidden sm:block">
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          {/* ヘッダー行 */}
          <div className="grid grid-cols-[2rem_1fr_6rem_5rem_5rem_5rem] items-center gap-4 border-b border-border bg-background/50 px-4 py-3 text-xs font-semibold text-muted">
            <span />
            <span>メニュー名</span>
            <span className="text-right">料金</span>
            <span className="text-center">時間</span>
            <span className="text-center">公開</span>
            <span />
          </div>
          {/* データ行 */}
          <div ref={listRef}>
            {services.map((service, index) => (
              <div
                key={service.id}
                data-sortable
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`grid grid-cols-[2rem_1fr_6rem_5rem_5rem_5rem] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 transition-all ${
                  dragIndex === index ? "opacity-50 bg-accent/5" : "hover:bg-background/50"
                } ${
                  overIndex === index && dragIndex !== index ? "ring-2 ring-inset ring-accent" : ""
                } ${!isPublished(service) ? "opacity-60" : ""}`}
              >
                {/* ドラッグハンドル */}
                <div className="flex cursor-grab items-center justify-center text-muted active:cursor-grabbing">
                  <DragIcon />
                </div>
                {/* メニュー名 */}
                <div className="flex items-center gap-2 min-w-0">
                  <Link href={`/provider/services/${service.id}/edit`} prefetch={false} className="truncate font-medium hover:text-accent">
                    {service.name}
                  </Link>
                  {!isPublished(service) && <UnpublishedBadge />}
                </div>
                {/* 料金 */}
                <p className="text-right font-semibold text-sm">¥{service.price.toLocaleString()}</p>
                {/* 時間 */}
                <p className="text-center text-sm text-muted">{service.duration_min}分</p>
                {/* 公開トグル */}
                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    checked={isPublished(service)}
                    onChange={() => handleToggle(service.id, isPublished(service))}
                    ariaLabel={isPublished(service) ? "公開中" : "非公開"}
                  />
                </div>
                {/* 編集リンク */}
                <Link
                  href={`/provider/services/${service.id}/edit`} prefetch={false}
                  className="flex items-center justify-center rounded-lg px-3 py-1.5 text-xs text-accent hover:bg-accent/8"
                >
                  編集
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
