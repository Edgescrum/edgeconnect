"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitSurvey, type SurveyBookingDetail, type SurveyResponseData } from "@/lib/actions/survey";
import { SURVEY_QUESTIONS, getQ2Text, getQ3Text, RATING_LABELS } from "@/lib/constants/survey-questions";
import { ProviderAvatar } from "@/components/ProviderAvatar";

function RatingSlider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-relaxed">{label}</p>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => !disabled && onChange(n)}
            disabled={disabled}
            className={`flex flex-col items-center gap-1 ${disabled ? "cursor-default" : ""}`}
          >
            <span className={`text-[10px] leading-tight ${value === n ? "text-accent font-semibold" : "text-muted"}`}>
              {RATING_LABELS[n]}
            </span>
            <span
              className={`flex h-11 sm:h-12 w-full items-center justify-center rounded-xl text-sm sm:text-base font-bold transition-all ${
                value === n
                  ? "bg-accent text-white shadow-md scale-105"
                  : "bg-gray-100 text-gray-500" + (disabled ? "" : " hover:bg-gray-200")
              }`}
            >
              {n}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]}) ${d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;
}

export function SurveyFormClient({ detail, readOnly = false }: { detail: SurveyBookingDetail; readOnly?: boolean }) {
  const router = useRouter();
  const rd = detail.responseData;
  const [csat, setCsat] = useState(rd?.csat ?? 0);
  const [driverService, setDriverService] = useState(rd?.driverService ?? 0);
  const [driverQuality, setDriverQuality] = useState(rd?.driverQuality ?? 0);
  const [driverPrice, setDriverPrice] = useState(rd?.driverPrice ?? 0);
  const [comment, setComment] = useState(rd?.comment ?? "");
  const [reviewText, setReviewText] = useState(rd?.reviewText ?? "");
  const [reviewPublic, setReviewPublic] = useState(rd?.reviewPublic ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValid = csat > 0 && driverService > 0 && driverQuality > 0 && driverPrice > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await submitSurvey({
      bookingId: detail.bookingId,
      csat,
      driverService,
      driverQuality,
      driverPrice,
      comment,
      reviewText,
      reviewPublic,
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "送信に失敗しました");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <h1 className="text-base font-semibold">アンケート</h1>
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mb-4 text-5xl">&#x1F389;</div>
          <p className="text-lg font-semibold">ご回答ありがとうございました</p>
          <p className="mt-2 text-sm text-muted">
            {detail.providerName}のサービス改善に役立てさせていただきます。
          </p>
          <button
            onClick={() => router.push("/surveys")}
            className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white"
          >
            アンケート一覧に戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/surveys" className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <h1 className="text-base font-semibold">アンケート</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
        {/* Provider & Booking Info */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col items-center text-center">
            <ProviderAvatar
              name={detail.providerName}
              iconUrl={detail.providerIconUrl}
              size={56}
            />
            <p className="mt-2 text-base font-semibold">{detail.providerName}</p>
            <p className="mt-0.5 text-sm text-muted">{detail.serviceName}</p>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 border-t border-border pt-3">
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{formatDate(detail.startAt)}</span>
            </div>
            {detail.servicePrice != null && (
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span>{detail.servicePrice.toLocaleString()}円</span>
              </div>
            )}
          </div>
        </div>

        {/* readOnly モード: 回答済みメッセージ */}
        {readOnly && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-900">回答済みです</p>
                <p className="text-xs leading-relaxed text-emerald-700">
                  ご回答ありがとうございました。以下は回答内容の確認です。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 目的・データ取り扱いメッセージ (未回答時のみ表示) */}
        {!readOnly && (
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-600" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-sky-900">
                  このアンケートはサービス品質の向上のために活用させていただきます
                </p>
                <p className="text-xs leading-relaxed text-sky-700">
                  回答データはサービス改善以外の目的で使用することはありません。率直なご意見をお聞かせください。
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Q1: CSAT */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-1 text-xs font-medium text-accent">Q1</div>
            <RatingSlider
              label={SURVEY_QUESTIONS.q1}
              value={csat}
              onChange={setCsat}
              disabled={readOnly}
            />
          </div>

          {/* Q2: 接客・対応 */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-1 text-xs font-medium text-accent">Q2</div>
            <RatingSlider
              label={getQ2Text(detail.providerCategory)}
              value={driverService}
              onChange={setDriverService}
              disabled={readOnly}
            />
          </div>

          {/* Q3: 仕上がり・品質 */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-1 text-xs font-medium text-accent">Q3</div>
            <RatingSlider
              label={getQ3Text(detail.providerCategory)}
              value={driverQuality}
              onChange={setDriverQuality}
              disabled={readOnly}
            />
          </div>

          {/* Q4: 料金 */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-1 text-xs font-medium text-accent">Q4</div>
            <RatingSlider
              label={SURVEY_QUESTIONS.q4}
              value={driverPrice}
              onChange={setDriverPrice}
              disabled={readOnly}
            />
          </div>

          {/* Q5: 自由記述 */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
            <div className="mb-1 text-xs font-medium text-accent">Q5</div>
            <p className="text-sm font-medium leading-relaxed">{SURVEY_QUESTIONS.q5}</p>
            <textarea
              value={comment}
              onChange={(e) => !readOnly && setComment(e.target.value)}
              readOnly={readOnly}
              placeholder="任意: ご意見・ご感想をお聞かせください"
              rows={3}
              className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none ${readOnly ? "cursor-default opacity-80" : ""}`}
            />
          </div>

          {/* Q6: 口コミ */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
            <div className="mb-1 text-xs font-medium text-accent">Q6</div>
            <p className="text-sm font-medium leading-relaxed">{SURVEY_QUESTIONS.q6}</p>
            <textarea
              value={reviewText}
              onChange={(e) => !readOnly && setReviewText(e.target.value)}
              readOnly={readOnly}
              placeholder="任意: おすすめコメントをお願いします"
              rows={3}
              className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none ${readOnly ? "cursor-default opacity-80" : ""}`}
            />
            {reviewText && !readOnly && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewPublic}
                  onChange={(e) => setReviewPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent accent-accent"
                />
                <span className="text-sm">このコメントを公開してもよいですか？</span>
              </label>
            )}
            {reviewText && readOnly && reviewPublic && (
              <p className="text-xs text-muted">公開許可済み</p>
            )}
            {reviewPublic && reviewText && !readOnly && (
              <p className="text-xs text-muted">
                公開された口コミはプロフィールページに匿名で表示されます。お名前は公開されません。
              </p>
            )}
          </div>

          {error && !readOnly && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {!readOnly && (
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "送信中..." : "回答を送信する"}
            </button>
          )}

          {readOnly && (
            <button
              type="button"
              onClick={() => router.push("/surveys")}
              className="w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-gray-200"
            >
              アンケート一覧に戻る
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
