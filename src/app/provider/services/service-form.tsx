"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ServiceFormProps {
  defaultValues?: {
    name: string;
    description: string | null;
    duration_min: number;
    price: number;
    cancel_deadline_hours: number;
    cancel_policy_note: string | null;
  };
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel: string;
}

export function ServiceForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: ServiceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await onSubmit(formData);
      router.push("/provider/services");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          サービス名
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name || ""}
          placeholder="例：カット"
          className="w-full rounded-xl border border-border bg-card px-4 py-3"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium"
        >
          説明
          <span className="ml-1 text-xs text-muted">（任意）</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description || ""}
          placeholder="例：スタイリッシュなカットをご提供します"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="duration_min"
            className="mb-1.5 block text-sm font-medium"
          >
            所要時間（分）
          </label>
          <input
            id="duration_min"
            name="duration_min"
            type="number"
            required
            min="1"
            defaultValue={defaultValues?.duration_min || 60}
            className="w-full rounded-xl border border-border bg-card px-4 py-3"
          />
        </div>
        <div>
          <label htmlFor="price" className="mb-1.5 block text-sm font-medium">
            料金（円）
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min="0"
            defaultValue={defaultValues?.price || 0}
            className="w-full rounded-xl border border-border bg-card px-4 py-3"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="cancel_deadline_hours"
          className="mb-1.5 block text-sm font-medium"
        >
          キャンセル期限
        </label>
        <div className="flex items-center gap-2">
          <input
            id="cancel_deadline_hours"
            name="cancel_deadline_hours"
            type="number"
            min="0"
            defaultValue={defaultValues?.cancel_deadline_hours || 24}
            className="w-24 rounded-xl border border-border bg-card px-4 py-3"
          />
          <span className="text-sm text-muted">時間前まで</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          お客さまがキャンセルできる期限です。0にすると直前までキャンセル可能になります。
        </p>
      </div>

      <div>
        <label
          htmlFor="cancel_policy_note"
          className="mb-1.5 block text-sm font-medium"
        >
          キャンセルポリシー
          <span className="ml-1 text-xs text-muted">（任意）</span>
        </label>
        <textarea
          id="cancel_policy_note"
          name="cancel_policy_note"
          rows={2}
          defaultValue={defaultValues?.cancel_policy_note || ""}
          placeholder="例：キャンセル料は発生しません。お早めにご連絡ください。"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-border px-6 py-3.5 font-semibold active:scale-[0.98]"
        >
          戻る
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
        >
          {submitting && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {submitting ? "処理中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
