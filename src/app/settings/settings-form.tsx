"use client";

import { useState } from "react";
import { updateUserSettings } from "@/lib/actions/user";

export function SettingsForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await updateUserSettings(name, phone);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          お名前
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="山田 太郎"
          className="w-full rounded-xl border border-border bg-card px-4 py-3"
        />
        <p className="mt-1 text-xs text-muted">予約時に自動入力されます</p>
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
          電話番号
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="090-1234-5678"
          inputMode="tel"
          className="w-full rounded-xl border border-border bg-card px-4 py-3"
        />
        <p className="mt-1 text-xs text-muted">予約時に自動入力されます</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">保存しました</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
      >
        {submitting && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {submitting ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
