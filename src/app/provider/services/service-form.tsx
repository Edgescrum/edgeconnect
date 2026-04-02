"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteService } from "@/lib/actions/service";

interface ServiceFormProps {
  serviceId?: number;
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
  serviceId,
  defaultValues,
  onSubmit,
  submitLabel,
}: ServiceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!serviceId) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteService(serviceId);
      router.push("/provider/services");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  const isEdit = !!serviceId;

  return (
    <>
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
            <label
              htmlFor="price"
              className="mb-1.5 block text-sm font-medium"
            >
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

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
        >
          {submitting && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {submitting ? "処理中..." : submitLabel}
        </button>
      </form>

      {/* 削除セクション（編集時のみ） */}
      {isEdit && (
        <div className="mt-10 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-red-500">危険な操作</h3>
          <p className="mt-1 text-xs text-muted">
            このメニューを削除すると元に戻せません。
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-3 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 active:scale-[0.98]"
          >
            このメニューを削除
          </button>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold">メニューを削除しますか？</h3>
            <p className="mt-2 text-sm text-muted">
              「{defaultValues?.name}」を削除します。この操作は元に戻せません。
            </p>
            {error && (
              <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-border py-3 font-semibold active:scale-[0.98]"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 font-semibold text-white active:scale-[0.98]"
              >
                {deleting && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
