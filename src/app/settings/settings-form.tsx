"use client";

import { useState } from "react";
import { updateUserSettings, updateUserAttributes } from "@/lib/actions/user";
import { formatPhoneAsYouType, isValidJapanesePhone, formatPhone } from "@/lib/phone";
import { Spinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";
import { FormLabel, FormInput } from "@/components/FormField";

const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
] as const;

const currentYear = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i);
const BIRTH_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

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
  const [phone, setPhone] = useState(() => defaultPhone ? formatPhone(defaultPhone) : "");
  const [gender, setGender] = useState(defaultGender);
  // Extract year and month from birth_date
  const [birthYear, setBirthYear] = useState(() => {
    if (!defaultBirthDate) return "";
    const year = new Date(defaultBirthDate).getFullYear();
    return isNaN(year) ? "" : String(year);
  });
  const [birthMonth, setBirthMonth] = useState(() => {
    if (!defaultBirthDate) return "";
    const month = new Date(defaultBirthDate).getMonth() + 1;
    return isNaN(month) ? "" : String(month);
  });
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
      // Convert birth year/month to a date for DB storage
      const birthDate = birthYear ? `${birthYear}-${(birthMonth || "1").padStart(2, "0")}-01` : null;
      await Promise.all([
        updateUserSettings(name, phone),
        updateUserAttributes(gender || null, birthDate),
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(gender === opt.value ? "" : opt.value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    gender === opt.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-card text-muted hover:border-accent/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FormLabel htmlFor="birthYear">生まれ年月</FormLabel>
            <div className="flex gap-2">
              <select
                id="birthYear"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">年</option>
                {BIRTH_YEARS.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}年
                  </option>
                ))}
              </select>
              <select
                id="birthMonth"
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="w-24 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">月</option>
                {BIRTH_MONTHS.map((month) => (
                  <option key={month} value={String(month)}>
                    {month}月
                  </option>
                ))}
              </select>
            </div>
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
