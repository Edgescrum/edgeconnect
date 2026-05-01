"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitSurvey, type SurveyBookingDetail } from "@/lib/actions/survey";
import { SURVEY_QUESTIONS, getQ2Text, getQ3Text, RATING_LABELS } from "@/lib/constants/survey-questions";
import { ProviderAvatar } from "@/components/ProviderAvatar";

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-relaxed">{label}</p>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="flex flex-col items-center gap-1"
          >
            <span className={`text-[10px] leading-tight ${value === n ? "text-accent font-semibold" : "text-muted"}`}>
              {RATING_LABELS[n]}
            </span>
            <span
              className={`flex h-11 sm:h-12 w-full items-center justify-center rounded-xl text-sm sm:text-base font-bold transition-all ${
                value === n
                  ? "bg-accent text-white shadow-md scale-105"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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

export function SurveyFormClient({ detail }: { detail: SurveyBookingDetail }) {
  const router = useRouter();
  const [csat, setCsat] = useState(0);
  const [driverService, setDriverService] = useState(0);
  const [driverQuality, setDriverQuality] = useState(0);
  const [driverPrice, setDriverPrice] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewPublic, setReviewPublic] = useState(false);
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
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4 sm:p-6">
          <ProviderAvatar
            name={detail.providerName}
            iconUrl={detail.providerIconUrl}
            size={48}
          />
          <div>
            <p className="font-semibold">{detail.providerName}</p>
            <p className="text-xs text-muted">{detail.serviceName}</p>
            {detail.servicePrice != null && (
              <p className="text-xs text-muted">{detail.servicePrice.toLocaleString()}円</p>
            )}
            <p className="text-xs text-muted">{formatDate(detail.startAt)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Q1: CSAT */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-1 text-xs font-medium text-accent">Q1</div>
            <RatingSlider
              label={SURVEY_QUESTIONS.q1}
              value={csat}
              onChange={setCsat}
            />
          </div>

          {/* Q2: 接客・対応 */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-1 text-xs font-medium text-accent">Q2</div>
            <RatingSlider
              label={getQ2Text(detail.providerCategory)}
              value={driverService}
              onChange={setDriverService}
            />
          </div>

          {/* Q3: 仕上がり・品質 */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-1 text-xs font-medium text-accent">Q3</div>
            <RatingSlider
              label={getQ3Text(detail.providerCategory)}
              value={driverQuality}
              onChange={setDriverQuality}
            />
          </div>

          {/* Q4: 料金 */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-1 text-xs font-medium text-accent">Q4</div>
            <RatingSlider
              label={SURVEY_QUESTIONS.q4}
              value={driverPrice}
              onChange={setDriverPrice}
            />
          </div>

          {/* Q5: 自由記述 */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
            <div className="mb-1 text-xs font-medium text-accent">Q5</div>
            <p className="text-sm font-medium leading-relaxed">{SURVEY_QUESTIONS.q5}</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="任意: ご意見・ご感想をお聞かせください"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {/* Q6: 口コミ */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
            <div className="mb-1 text-xs font-medium text-accent">Q6</div>
            <p className="text-sm font-medium leading-relaxed">{SURVEY_QUESTIONS.q6}</p>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="任意: おすすめコメントをお願いします"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
            />
            {reviewText && (
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
            {reviewPublic && reviewText && (
              <p className="text-xs text-muted">
                公開された口コミはプロフィールページに表示されます。お名前（表示名）とともに公開されます。
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "送信中..." : "回答を送信する"}
          </button>
        </form>
      </div>
    </main>
  );
}
