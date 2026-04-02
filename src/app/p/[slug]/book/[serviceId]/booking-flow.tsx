"use client";

import { useState } from "react";
import { getAvailableSlots, createBooking } from "@/lib/actions/booking";

interface Service {
  id: number;
  name: string;
  duration_min: number;
  price: number;
}

export function BookingFlow({
  providerId,
  providerName,
  providerSlug,
  service,
}: {
  providerId: number;
  providerName: string;
  providerSlug: string;
  service: Service;
}) {
  const [step, setStep] = useState<"date" | "confirm" | "done">("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<{ slot_start: string; slot_end: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ slot_start: string; slot_end: string } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // 今日から14日分の日付を生成
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split("T")[0];
  });

  async function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setError(null);
    setLoadingSlots(true);
    try {
      const available = await getAvailableSlots(providerId, service.id, date);
      setSlots(available);
    } catch (e) {
      setError(e instanceof Error ? e.message : "空き枠の取得に失敗しました");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleSlotSelect(slot: { slot_start: string; slot_end: string }) {
    setSelectedSlot(slot);
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!selectedSlot) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await createBooking(
        providerId,
        service.id,
        selectedSlot.slot_start
      );
      setBookingId(typeof result === "object" && result !== null ? (result as { id: string }).id : null);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "予約に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return {
      month: d.getMonth() + 1,
      day: d.getDate(),
      weekday: days[d.getDay()],
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
  }

  function formatTime(isoStr: string) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          {step === "date" ? (
            <a
              href={`/p/${providerSlug}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </a>
          ) : step === "confirm" ? (
            <button
              onClick={() => setStep("date")}
              className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          ) : null}
          <h1 className="text-base font-semibold">
            {step === "date" && "日時を選択"}
            {step === "confirm" && "予約内容の確認"}
            {step === "done" && "予約完了"}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6">
        {/* サービス情報 */}
        {step !== "done" && (
          <div className="mb-6 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-xs text-muted">{providerName}</p>
            <p className="mt-1 font-semibold">{service.name}</p>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="font-bold">¥{service.price.toLocaleString()}</span>
              <span className="text-muted">{service.duration_min}分</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Step 1: 日時選択 */}
        {step === "date" && (
          <div>
            {/* 日付選択 */}
            <h2 className="mb-3 text-sm font-semibold">日付</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map((date) => {
                const { month, day, weekday, isWeekend } = formatDate(date);
                const isSelected = date === selectedDate;
                return (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className={`flex min-w-[3.5rem] shrink-0 flex-col items-center rounded-xl px-3 py-2.5 transition-colors ${
                      isSelected
                        ? "bg-accent text-white"
                        : "bg-card ring-1 ring-border active:bg-accent-bg"
                    }`}
                  >
                    <span className="text-[10px]">{month}月</span>
                    <span className="text-lg font-bold">{day}</span>
                    <span
                      className={`text-xs ${
                        isSelected
                          ? "text-white/80"
                          : isWeekend
                            ? "text-red-400"
                            : "text-muted"
                      }`}
                    >
                      {weekday}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 時間帯選択 */}
            {selectedDate && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-semibold">時間帯</h2>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border">
                    <p className="text-sm text-muted">
                      この日は空きがありません
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.slot_start}
                        onClick={() => handleSlotSelect(slot)}
                        className="rounded-xl bg-card px-3 py-3 text-center text-sm font-medium ring-1 ring-border active:bg-accent active:text-white"
                      >
                        {formatTime(slot.slot_start)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: 確認 */}
        {step === "confirm" && selectedSlot && (
          <div>
            <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">日時</span>
                  <span className="font-semibold">
                    {(() => {
                      const { month, day, weekday } = formatDate(selectedDate);
                      return `${month}/${day}（${weekday}）${formatTime(selectedSlot.slot_start)}〜${formatTime(selectedSlot.slot_end)}`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">メニュー</span>
                  <span className="font-semibold">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">所要時間</span>
                  <span className="font-semibold">{service.duration_min}分</span>
                </div>
                <div className="flex justify-between border-t border-border pt-4">
                  <span className="text-sm text-muted">料金</span>
                  <span className="text-lg font-bold">
                    ¥{service.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="mt-6 flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
            >
              {submitting && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {submitting ? "処理中..." : "予約を確定する"}
            </button>
          </div>
        )}

        {/* Step 3: 完了 */}
        {step === "done" && (
          <div className="flex flex-col items-center pt-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
              ✓
            </div>
            <h2 className="mt-4 text-xl font-bold">予約が確定しました</h2>
            <p className="mt-2 text-sm text-muted">
              {providerName}への予約が完了しました。
            </p>

            <div className="mt-6 w-full rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border text-left">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">日時</span>
                  <span className="text-sm font-semibold">
                    {selectedSlot &&
                      (() => {
                        const { month, day, weekday } = formatDate(selectedDate);
                        return `${month}/${day}（${weekday}）${formatTime(selectedSlot.slot_start)}`;
                      })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">メニュー</span>
                  <span className="text-sm font-semibold">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">料金</span>
                  <span className="text-sm font-bold">
                    ¥{service.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 w-full space-y-2.5">
              {bookingId && (
                <a
                  href={`/bookings/${bookingId}`}
                  className="block w-full rounded-xl bg-accent py-3.5 text-center font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
                >
                  予約詳細を見る
                </a>
              )}
              <a
                href="/"
                className="block w-full rounded-xl border border-border py-3.5 text-center font-semibold active:scale-[0.98]"
              >
                トップに戻る
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
