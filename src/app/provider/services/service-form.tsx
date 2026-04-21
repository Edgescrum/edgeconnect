"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteService } from "@/lib/actions/service";
import { Spinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";

interface CustomField {
  label: string;
  type: "input" | "textarea";
  required: boolean;
}

interface ServiceFormProps {
  serviceId?: number;
  defaultValues?: {
    name: string;
    caption: string | null;
    description: string | null;
    duration_min: number;
    price: number;
    cancel_deadline_hours: number;
    cancel_policy_note: string | null;
    custom_fields: CustomField[] | null;
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
  const [customFields, setCustomFields] = useState<CustomField[]>(
    defaultValues?.custom_fields || []
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set(
        "custom_fields",
        customFields.length > 0 ? JSON.stringify(customFields) : ""
      );
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

  function addCustomField() {
    if (customFields.length >= 3) return;
    setCustomFields([...customFields, { label: "", type: "input", required: false }]);
  }

  function updateCustomField(index: number, updates: Partial<CustomField>) {
    setCustomFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  }

  function removeCustomField(index: number) {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
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
            htmlFor="caption"
            className="mb-1.5 block text-sm font-medium"
          >
            キャプション
            <span className="ml-1 text-xs text-muted">（任意・最大50文字）</span>
          </label>
          <input
            id="caption"
            name="caption"
            type="text"
            maxLength={50}
            defaultValue={defaultValues?.caption || ""}
            placeholder="例：スタイリッシュなカットをご提供"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
          />
          <p className="mt-1 text-xs text-muted">
            メニュー一覧のカードに表示される短い説明です。
          </p>
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
            rows={4}
            defaultValue={defaultValues?.description || ""}
            placeholder="例：お客さまの骨格や髪質に合わせた似合わせカットを行います。カウンセリング込みで丁寧に仕上げます。"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
          />
          <p className="mt-1 text-xs text-muted">
            メニューをタップした後に表示される詳しい説明です。
          </p>
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
              inputMode="numeric"
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
              inputMode="numeric"
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
              inputMode="numeric"
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

        {/* カスタム入力項目 */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium">
              追加の入力項目
              <span className="ml-1 text-xs text-muted">（任意・最大3つ）</span>
            </label>
          </div>
          <p className="mb-3 text-xs text-muted">
            予約時にお客さまへ追加で聞きたい項目を設定できます。
          </p>

          {customFields.length > 0 && (
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-card p-4 ring-1 ring-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateCustomField(index, { label: e.target.value })
                        }
                        placeholder="項目名（例：ご要望）"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex rounded-lg bg-background p-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateCustomField(index, { type: "input" })
                            }
                            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                              field.type === "input"
                                ? "bg-card shadow-sm"
                                : "text-muted"
                            }`}
                          >
                            1行テキスト
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateCustomField(index, { type: "textarea" })
                            }
                            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                              field.type === "textarea"
                                ? "bg-card shadow-sm"
                                : "text-muted"
                            }`}
                          >
                            複数行テキスト
                          </button>
                        </div>
                        <label className="flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateCustomField(index, {
                                required: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          必須
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="shrink-0 rounded-lg p-1.5 text-muted hover:text-red-500 active:bg-red-50"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {customFields.length < 3 && (
            <button
              type="button"
              onClick={addCustomField}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted active:scale-[0.98]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              項目を追加
            </button>
          )}
        </div>

        {error && (
          <Alert type="error">{error}</Alert>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
        >
          {submitting && (
            <Spinner size="sm" className="border-white border-t-transparent" />
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
              <div className="mt-3">
                <Alert type="error">{error}</Alert>
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
                  <Spinner size="sm" className="border-white border-t-transparent" />
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
