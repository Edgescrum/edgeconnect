"use client";

import { useState, useMemo } from "react";
import { getAvailableSlots, createBooking } from "@/lib/actions/booking";

interface CustomField {
  label: string;
  type: "input" | "textarea";
  required: boolean;
}

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_min: number;
  price: number;
  custom_fields: CustomField[] | null;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function BookingFlow({
  providerId,
  providerName,
  providerSlug,
  service,
  brandColor = "#6366f1",
  isLineFriend = false,
}: {
  providerId: number;
  providerName: string;
  providerSlug: string;
  service: Service;
  brandColor?: string;
  isLineFriend?: boolean;
}) {
  const [step, setStep] = useState<"date" | "confirm" | "done">("date");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({});
  const [descOpen, setDescOpen] = useState(false);
  const [showFriendPrompt, setShowFriendPrompt] = useState(false);

  // カレンダー状態
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<{ slot_start: string; slot_end: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ slot_start: string; slot_end: string } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // カレンダーグリッド生成
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = firstDay.getDay(); // 0=日

    const days: (Date | null)[] = [];
    // 先頭の空セル
    for (let i = 0; i < startDow; i++) days.push(null);
    // 日付
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    return days;
  }, [viewYear, viewMonth]);

  // 月の移動制限: 当月 〜 3ヶ月先
  const maxMonth = today.getMonth() + 3;
  const maxYear = today.getFullYear() + Math.floor(maxMonth / 12);
  const canPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();
  const canNext = viewYear < maxYear || (viewYear === maxYear && viewMonth < maxMonth % 12);

  function prevMonth() {
    if (!canPrev) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (!canNext) return;
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function isDateSelectable(date: Date) {
    return date > today;
  }

  function toDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

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
  }

  function validateForm(): boolean {
    if (!selectedSlot) return false;
    if (!customerName.trim()) {
      setError("お名前を入力してください");
      return false;
    }
    if (!customerPhone.trim()) {
      setError("電話番号を入力してください");
      return false;
    }
    const fields = service.custom_fields || [];
    for (let i = 0; i < fields.length; i++) {
      if (fields[i].required && !customAnswers[i]?.trim()) {
        setError(`「${fields[i].label}」を入力してください`);
        return false;
      }
    }
    setError(null);
    return true;
  }

  async function handleConfirm() {
    if (!validateForm()) return;
    // 最新の友だち状態をAPIで確認
    try {
      const res = await fetch("/api/user/friend-status");
      const { isLineFriend: isFriend } = await res.json();
      if (!isFriend) {
        setShowFriendPrompt(true);
        return;
      }
    } catch {
      // 取得失敗時はそのまま予約に進む
    }
    submitBooking();
  }

  async function submitBooking() {
    if (!selectedSlot) return;
    setShowFriendPrompt(false);
    setSubmitting(true);
    try {
      const fields = service.custom_fields || [];
      const answers = fields.length > 0
        ? fields.map((f, i) => ({ label: f.label, value: customAnswers[i] || "" })).filter((a) => a.value)
        : undefined;
      const result = await createBooking(
        providerId,
        service.id,
        selectedSlot.slot_start,
        customerName,
        customerPhone,
        answers
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
    return {
      month: d.getMonth() + 1,
      day: d.getDate(),
      weekday: WEEKDAY_LABELS[d.getDay()],
    };
  }

  function formatTime(isoStr: string) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }

  const brandBg = `color-mix(in srgb, ${brandColor} 10%, transparent)`;

  return (
    <main
      className="min-h-screen bg-background"
      style={{ "--accent": brandColor, "--accent-bg": brandBg, "--accent-light": brandColor } as React.CSSProperties}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 sm:max-w-3xl sm:px-8">
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

      <div className="mx-auto max-w-lg px-4 py-6 sm:max-w-3xl sm:px-8">
        {/* サービス情報 */}
        {step !== "done" && (
          <div className={`mb-6 rounded-2xl bg-card shadow-sm ring-1 ring-border ${step === "confirm" ? "sm:mx-auto sm:max-w-lg" : ""}`}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted">{providerName}</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug">{service.name}</p>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2 text-sm">
                <span className="font-bold">¥{service.price.toLocaleString()}</span>
                <span className="text-xs text-muted">{service.duration_min}分</span>
              </div>
            </div>
            {service.description && (
              <>
                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => setDescOpen(!descOpen)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-muted active:bg-background/50"
                  >
                    <span>詳しい説明</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform ${descOpen ? "rotate-180" : ""}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>
                {descOpen && (
                  <div className="border-t border-border px-4 py-3">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted">
                      {service.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error && (
          <div className={`mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ${step === "confirm" ? "sm:mx-auto sm:max-w-lg" : ""}`}>
            {error}
          </div>
        )}

        {/* Step 1: 日時選択 */}
        {step === "date" && (
          <><div className="sm:flex sm:gap-6 sm:items-start">
            {/* 月カレンダー */}
            <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border sm:w-[340px] sm:shrink-0 sm:p-5">
              {/* 月ナビ */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prevMonth}
                  disabled={!canPrev}
                  className="flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-20 active:bg-accent-bg"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <span className="text-sm font-semibold">
                  {viewYear}年{viewMonth + 1}月
                </span>
                <button
                  onClick={nextMonth}
                  disabled={!canNext}
                  className="flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-20 active:bg-accent-bg"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* 曜日ヘッダー */}
              <div className="mt-3 grid grid-cols-7 text-center">
                {WEEKDAY_LABELS.map((label, i) => (
                  <div
                    key={label}
                    className={`py-1 text-xs font-medium ${
                      i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-muted"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* 日付グリッド */}
              <div className="mt-1 grid grid-cols-7 gap-0.5">
                {calendarDays.map((date, i) => {
                  if (!date) {
                    return <div key={`empty-${i}`} className="aspect-square" />;
                  }

                  const dateStr = toDateString(date);
                  const selectable = isDateSelectable(date);
                  const isSelected = dateStr === selectedDate;
                  const isToday = toDateString(today) === dateStr;
                  const dow = date.getDay();

                  return (
                    <button
                      key={dateStr}
                      onClick={() => selectable && handleDateSelect(dateStr)}
                      disabled={!selectable}
                      className={`relative flex aspect-square items-center justify-center rounded-xl text-sm transition-colors ${
                        isSelected
                          ? "bg-accent font-bold text-white"
                          : selectable
                            ? "font-medium active:bg-accent-bg"
                            : "text-gray-300"
                      } ${
                        !isSelected && selectable && dow === 0
                          ? "text-red-500"
                          : ""
                      } ${
                        !isSelected && selectable && dow === 6
                          ? "text-blue-500"
                          : ""
                      }`}
                    >
                      {date.getDate()}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 時間帯選択 */}
            {selectedDate && (
              <div className="mt-6 sm:mt-0 sm:flex-1 sm:min-w-0">
                <h2 className="mb-3 text-sm font-semibold">
                  {(() => {
                    const { month, day, weekday } = formatDate(selectedDate);
                    return `${month}/${day}（${weekday}）の空き`;
                  })()}
                </h2>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border">
                    <p className="text-sm text-muted">この日は空きがありません</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.slot_start === slot.slot_start;
                      return (
                        <button
                          key={slot.slot_start}
                          onClick={() => handleSlotSelect(slot)}
                          className={`rounded-xl px-3 py-3 text-center text-sm font-medium ring-1 transition-colors ${
                            isSelected
                              ? "bg-accent text-white ring-accent"
                              : "bg-card ring-border active:bg-accent-bg"
                          }`}
                        >
                          {formatTime(slot.slot_start)}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 予約に進むボタン（モバイル） */}
                {selectedSlot && (
                  <button
                    onClick={() => setStep("confirm")}
                    className="mt-6 flex w-full items-center justify-center rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98] sm:hidden"
                  >
                    予約に進む
                  </button>
                )}
              </div>
            )}
          </div>
          {/* 予約に進むボタン（PC: カレンダー+時間帯の下） */}
          {selectedSlot && (
            <button
              onClick={() => setStep("confirm")}
              className="mt-6 hidden w-full items-center justify-center rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98] sm:flex"
            >
              予約に進む
            </button>
          )}
          </>
        )}

        {/* Step 2: 確認 */}
        {step === "confirm" && selectedSlot && (
          <div className="sm:mx-auto sm:max-w-lg">
            {/* お客さま情報 */}
            <div className="mb-4 space-y-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="山田 太郎"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="090-1234-5678"
                  inputMode="tel"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3"
                />
              </div>
              {(service.custom_fields || []).map((field, index) => (
                <div key={index}>
                  <label className="mb-1.5 block text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={customAnswers[index] || ""}
                      onChange={(e) =>
                        setCustomAnswers((prev) => ({ ...prev, [index]: e.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={customAnswers[index] || ""}
                      onChange={(e) =>
                        setCustomAnswers((prev) => ({ ...prev, [index]: e.target.value }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                    />
                  )}
                </div>
              ))}
            </div>

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
                  <span className="text-lg font-bold">¥{service.price.toLocaleString()}</span>
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
          <div className="flex flex-col items-center pt-8 text-center sm:mx-auto sm:max-w-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
              ✓
            </div>
            <h2 className="mt-4 text-xl font-bold">予約が確定しました</h2>
            <p className="mt-2 text-sm text-muted">
              {providerName}への予約が完了しました。
            </p>

            <div className="mt-6 w-full rounded-2xl bg-card p-5 text-left shadow-sm ring-1 ring-border">
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
                  <span className="text-sm font-bold">¥{service.price.toLocaleString()}</span>
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
                href={`/p/${providerSlug}`}
                className="block w-full rounded-xl border border-border py-3.5 text-center font-semibold active:scale-[0.98]"
              >
                もう一度予約する
              </a>
              <a
                href="/home"
                className="block w-full py-3 text-center text-sm text-muted"
              >
                トップに戻る
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 友だち追加確認モーダル */}
      {showFriendPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowFriendPrompt(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold">LINE通知が届きません</h3>
              <p className="mt-2 text-sm text-muted">
                友だち追加すると予約確認・リマインダーが届きます
              </p>
            </div>
            <div className="mt-6 space-y-2.5">
              {process.env.NEXT_PUBLIC_LINE_BOT_BASIC_ID && (
                <a
                  href={`https://line.me/R/ti/p/${process.env.NEXT_PUBLIC_LINE_BOT_BASIC_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowFriendPrompt(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3.5 font-semibold text-white active:scale-[0.98]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  友だち追加してから予約する
                </a>
              )}
              <button
                onClick={submitBooking}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3.5 font-semibold text-muted active:scale-[0.98]"
              >
                {submitting && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {submitting ? "処理中..." : "友だち追加せずに予約する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
