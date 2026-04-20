"use client";

import { useState, useRef, useEffect } from "react";
import type { Category } from "@/lib/constants/categories";

interface CategorySelectorProps {
  categories: Category[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
}

export function CategorySelector({
  categories,
  selected,
  onChange,
  multiple = false,
  placeholder = "カテゴリを選択",
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(value: string) {
    if (multiple) {
      onChange(
        selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value]
      );
    } else {
      onChange(selected.includes(value) ? [] : [value]);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* トリガー */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[42px] w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left text-sm transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
          <path d="M4 6h16M4 12h16M4 18h7" />
        </svg>

        {selected.length === 0 ? (
          <span className="text-muted">{placeholder}</span>
        ) : (
          <div className="flex flex-1 flex-wrap gap-1">
            {selected.slice(0, 5).map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-white"
              >
                {categories.find((c) => c.value === v)?.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-white/30"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {selected.length > 5 && (
              <span className="inline-flex items-center rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-accent">
                +{selected.length - 5}
              </span>
            )}
          </div>
        )}

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* ドロップダウンリスト */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl bg-card p-1 shadow-lg ring-1 ring-border">
          {multiple && selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mb-1 w-full rounded-lg px-3 py-2 text-center text-xs text-muted hover:bg-accent/5"
            >
              すべて解除
            </button>
          )}
          {categories.map((c) => {
            const isSelected = selected.includes(c.value);
            return (
              <button
                type="button"
                key={c.value}
                onClick={() => toggle(c.value)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected ? "bg-accent/10" : "hover:bg-accent/5"
                }`}
              >
                {multiple && (
                  <div
                    className={`flex shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-card"
                    }`}
                    style={{ width: 18, height: 18 }}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                )}
                <span className={isSelected ? "font-medium text-accent" : ""}>{c.label}</span>
                {!multiple && isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto text-accent">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
