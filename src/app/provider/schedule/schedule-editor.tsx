"use client";

import { useState } from "react";
import {
  updateBusinessHours,
  updateInterval,
  addBlockedSlot,
  removeBlockedSlot,
  type BusinessHours,
} from "@/lib/actions/schedule";

// 月〜日の順で表示（日曜を最後に）
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS: Record<number, string> = {
  0: "日", 1: "月", 2: "火", 3: "水", 4: "木", 5: "金", 6: "土",
};

const DEFAULT_HOURS: BusinessHours = {
  "0": null,
  "1": { open: "09:00", close: "18:00" },
  "2": { open: "09:00", close: "18:00" },
  "3": { open: "09:00", close: "18:00" },
  "4": { open: "09:00", close: "18:00" },
  "5": { open: "09:00", close: "18:00" },
  "6": { open: "09:00", close: "18:00" },
};

interface BlockedSlot {
  id: number;
  start_at: string;
  end_at: string;
  reason: string | null;
}

interface Settings {
  provider_id: number;
  interval_before_min: number;
  interval_after_min: number;
  business_hours: BusinessHours | null;
}

export function ScheduleEditor({
  settings,
  blockedSlots,
}: {
  settings: Settings | null;
  blockedSlots: BlockedSlot[];
}) {
  const [hours, setHours] = useState<BusinessHours>(
    (settings?.business_hours as BusinessHours) || DEFAULT_HOURS
  );
  const [intervalBefore, setIntervalBefore] = useState(
    settings?.interval_before_min || 0
  );
  const [intervalAfter, setIntervalAfter] = useState(
    settings?.interval_after_min || 0
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Block form
  const [blockMode, setBlockMode] = useState<"single" | "range">("single");
  const [blockDate, setBlockDate] = useState("");
  const [blockEndDate, setBlockEndDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("09:00");
  const [blockEndTime, setBlockEndTime] = useState("18:00");
  const [blockReason, setBlockReason] = useState("");

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2000);
  }

  function toggleDay(day: string) {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: "09:00", close: "18:00" },
    }));
  }

  function updateTime(
    day: string,
    field: "open" | "close",
    value: string
  ) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day]!, [field]: value },
    }));
  }

  async function saveHours() {
    setError(null);
    setSaving("hours");
    try {
      await updateBusinessHours(hours);
      showSuccess("営業時間を保存しました");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(null);
    }
  }

  async function saveInterval() {
    setError(null);
    setSaving("interval");
    try {
      await updateInterval(intervalBefore, intervalAfter);
      showSuccess("インターバルを保存しました");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(null);
    }
  }

  async function handleAddBlock() {
    if (!blockDate) return;
    setError(null);
    setSaving("block");
    try {
      if (blockMode === "range" && blockEndDate) {
        // 期間: 各日にブロックを追加
        const start = new Date(blockDate);
        const end = new Date(blockEndDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          await addBlockedSlot(
            `${dateStr}T${blockStartTime}:00`,
            `${dateStr}T${blockEndTime}:00`,
            blockReason || null
          );
        }
      } else {
        await addBlockedSlot(
          `${blockDate}T${blockStartTime}:00`,
          `${blockDate}T${blockEndTime}:00`,
          blockReason || null
        );
      }
      setBlockDate("");
      setBlockEndDate("");
      setBlockReason("");
      showSuccess("ブロックを追加しました");
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました");
    } finally {
      setSaving(null);
    }
  }

  async function handleRemoveBlock(id: number) {
    setError(null);
    setSaving(`remove-${id}`);
    try {
      await removeBlockedSlot(id);
      showSuccess("ブロックを解除しました");
    } catch (e) {
      setError(e instanceof Error ? e.message : "解除に失敗しました");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
          ✓ {success}
        </div>
      )}

      {/* 営業時間 */}
      <section>
        <h2 className="text-sm font-semibold">営業時間</h2>
        <p className="mt-1 text-xs text-muted">
          曜日ごとに営業時間を設定します。オフにすると定休日です。
        </p>
        <div className="mt-4 space-y-2">
          {DAY_ORDER.map((i) => {
            const day = String(i);
            const label = DAY_LABELS[i];
            const isOpen = hours[day] !== null;
            return (
              <div
                key={day}
                className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border"
              >
                <button
                  onClick={() => toggleDay(day)}
                  className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ${
                    isOpen ? "bg-success" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                      isOpen ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className={`w-6 text-center text-sm font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}`}>
                  {label}
                </span>
                {isOpen ? (
                  <div className="flex flex-1 items-center gap-1">
                    <input
                      type="time"
                      value={hours[day]!.open}
                      onChange={(e) => updateTime(day, "open", e.target.value)}
                      className="w-[5.5rem] rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-muted">〜</span>
                    <input
                      type="time"
                      value={hours[day]!.close}
                      onChange={(e) => updateTime(day, "close", e.target.value)}
                      className="w-[5.5rem] rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-muted">定休日</span>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={saveHours}
          disabled={saving === "hours"}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
        >
          {saving === "hours" && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {saving === "hours" ? "処理中..." : "営業時間を保存"}
        </button>
      </section>

      {/* インターバル */}
      <section>
        <h2 className="text-sm font-semibold">予約のインターバル</h2>
        <p className="mt-1 text-xs text-muted">
          予約と予約の間に確保するバッファ時間です。準備や移動に必要な時間を設定してください。
        </p>
        <div className="mt-4 rounded-xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted">
                予約前
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={intervalBefore}
                  onChange={(e) =>
                    setIntervalBefore(parseInt(e.target.value) || 0)
                  }
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm"
                />
                <span className="text-xs text-muted">分</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted">
                予約後
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={intervalAfter}
                  onChange={(e) =>
                    setIntervalAfter(parseInt(e.target.value) || 0)
                  }
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm"
                />
                <span className="text-xs text-muted">分</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={saveInterval}
          disabled={saving === "interval"}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
        >
          {saving === "interval" && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {saving === "interval" ? "処理中..." : "インターバルを保存"}
        </button>
      </section>

      {/* 手動ブロック */}
      <section>
        <h2 className="text-sm font-semibold">手動ブロック</h2>
        <p className="mt-1 text-xs text-muted">
          特定の日時を予約不可にします。
        </p>

        {/* 追加フォーム */}
        <div className="mt-4 rounded-xl bg-card p-4 ring-1 ring-border">
          <div className="space-y-3">
            {/* モード切替 */}
            <div className="flex rounded-lg bg-background p-1">
              <button
                type="button"
                onClick={() => setBlockMode("single")}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  blockMode === "single"
                    ? "bg-card shadow-sm"
                    : "text-muted"
                }`}
              >
                1日
              </button>
              <button
                type="button"
                onClick={() => setBlockMode("range")}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  blockMode === "range"
                    ? "bg-card shadow-sm"
                    : "text-muted"
                }`}
              >
                期間
              </button>
            </div>

            {blockMode === "single" ? (
              <div>
                <label className="mb-1 block text-xs text-muted">日付</label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-muted">開始日</label>
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => {
                      setBlockDate(e.target.value);
                      if (!blockEndDate || e.target.value > blockEndDate) {
                        setBlockEndDate(e.target.value);
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <span className="mt-5 text-xs text-muted">〜</span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-muted">終了日</label>
                  <input
                    type="date"
                    value={blockEndDate}
                    min={blockDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted">開始時間</label>
                <input
                  type="time"
                  value={blockStartTime}
                  onChange={(e) => setBlockStartTime(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted">終了時間</label>
                <input
                  type="time"
                  value={blockEndTime}
                  onChange={(e) => setBlockEndTime(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                メモ（任意）
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="例：夏季休暇"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleAddBlock}
            disabled={!blockDate || (blockMode === "range" && !blockEndDate) || saving === "block"}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold disabled:opacity-40 active:scale-[0.98]"
          >
            {saving === "block" && (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            ブロックを追加
          </button>
        </div>

        {/* ブロック一覧 */}
        {blockedSlots.length > 0 && (
          <div className="mt-4 space-y-2">
            {blockedSlots.map((slot) => {
              const start = new Date(slot.start_at);
              const end = new Date(slot.end_at);
              const dateStr = start.toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
                weekday: "short",
              });
              const timeStr = `${start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} 〜 ${end.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;

              return (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-xl bg-card p-3 ring-1 ring-border"
                >
                  <div>
                    <p className="text-sm font-medium">{dateStr}</p>
                    <p className="text-xs text-muted">{timeStr}</p>
                    {slot.reason && (
                      <p className="mt-0.5 text-xs text-muted">
                        {slot.reason}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveBlock(slot.id)}
                    disabled={saving === `remove-${slot.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs text-red-500 active:bg-red-50 disabled:opacity-50"
                  >
                    {saving === `remove-${slot.id}` ? "..." : "解除"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
