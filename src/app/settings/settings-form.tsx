"use client";

import { useState } from "react";
import { updateUserSettings } from "@/lib/actions/user";
import { formatPhoneAsYouType, isValidJapanesePhone } from "@/lib/phone";
import { Spinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";
import { FormLabel, FormInput } from "@/components/FormField";

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
    if (phone.trim() && !isValidJapanesePhone(phone)) {
      setError("正しい電話番号を入力してください");
      setSubmitting(false);
      return;
    }
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
        <FormLabel htmlFor="name">お名前</FormLabel>
        <FormInput
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="山田 太郎"
        />
        <p className="mt-1 text-xs text-muted">予約時に自動入力されます</p>
      </div>

      <div>
        <FormLabel htmlFor="phone">電話番号</FormLabel>
        <FormInput
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhoneAsYouType(e.target.value))}
          placeholder="090-1234-5678"
          inputMode="tel"
        />
        <p className="mt-1 text-xs text-muted">予約時に自動入力されます</p>
      </div>

      {error && (
        <Alert type="error">{error}</Alert>
      )}
      {success && (
        <Alert type="success">保存しました</Alert>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
      >
        {submitting && (
          <Spinner size="sm" className="border-white border-t-transparent" />
        )}
        {submitting ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
