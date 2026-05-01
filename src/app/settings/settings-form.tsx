"use client";

import { useState } from "react";
import { updateUserSettings, updateUserAttributes } from "@/lib/actions/user";
import { formatPhoneAsYouType, isValidJapanesePhone } from "@/lib/phone";
import { Spinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";
import { FormLabel, FormInput } from "@/components/FormField";

const GENDER_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
] as const;

export function SettingsForm({
  defaultName,
  defaultPhone,
  defaultGender,
  defaultBirthDate,
}: {
  defaultName: string;
  defaultPhone: string;
  defaultGender: string;
  defaultBirthDate: string;
}) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [gender, setGender] = useState(defaultGender);
  const [birthDate, setBirthDate] = useState(defaultBirthDate);
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
      await Promise.all([
        updateUserSettings(name, phone),
        updateUserAttributes(gender || null, birthDate || null),
      ]);
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

      <div className="border-t border-border pt-5">
        <p className="mb-3 text-xs font-medium text-muted">
          以下の項目は任意です。入力するとより適切なサービス推薦に活用されます。
        </p>

        <div className="space-y-4">
          <div>
            <FormLabel htmlFor="gender">性別</FormLabel>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FormLabel htmlFor="birthDate">生年月日</FormLabel>
            <FormInput
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>
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
