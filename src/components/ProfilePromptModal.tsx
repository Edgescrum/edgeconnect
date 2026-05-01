"use client";

import { useState, useEffect, useTransition } from "react";
import { updateUserSettings, updateUserAttributes } from "@/lib/actions/user";

const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
] as const;

const currentYear = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i);

const MODAL_DISMISSED_KEY = "peco_profile_modal_dismissed";

export function ProfilePromptModal() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(MODAL_DISMISSED_KEY);
    if (!dismissed) {
      setShow(true);
    }
  }, []);

  function handleDismiss() {
    // Don't permanently dismiss - show again next time
    setShow(false);
  }

  function handleSubmit() {
    if (!name.trim()) {
      setError("お名前を入力してください");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const birthDate = birthYear ? `${birthYear}-01-01` : null;
        await Promise.all([
          updateUserSettings(name, ""),
          updateUserAttributes(gender || null, birthDate),
        ]);
        localStorage.setItem(MODAL_DISMISSED_KEY, "1");
        setShow(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存に失敗しました");
      }
    });
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold">プロフィール登録</h3>
          <p className="mt-1 text-sm text-muted">
            予約時に使用されるお名前を登録してください
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">お名前 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">性別</label>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(gender === opt.value ? "" : opt.value)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    gender === opt.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-card text-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">生まれ年</label>
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">選択してください</option>
              {BIRTH_YEARS.map((year) => (
                <option key={year} value={String(year)}>
                  {year}年
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className="mt-6 space-y-2.5">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
          >
            {isPending ? "保存中..." : "登録する"}
          </button>
          <button
            onClick={handleDismiss}
            className="w-full rounded-xl py-3 text-sm text-muted active:bg-gray-50"
          >
            あとで
          </button>
        </div>
      </div>
    </div>
  );
}
