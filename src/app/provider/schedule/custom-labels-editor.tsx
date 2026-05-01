"use client";

import { useState, useTransition } from "react";
import { saveCustomerCustomLabels } from "@/lib/actions/customer";

export function CustomLabelsEditor({
  initialLabels,
  isStandardPlan,
}: {
  initialLabels: string[];
  isStandardPlan: boolean;
}) {
  const [labels, setLabels] = useState<string[]>(() => {
    const arr = [...initialLabels];
    while (arr.length < 3) arr.push("");
    return arr;
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(index: number, value: string) {
    const next = [...labels];
    next[index] = value;
    setLabels(next);
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveCustomerCustomLabels(labels.filter(Boolean));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        alert("保存に失敗しました");
      }
    });
  }

  if (!isStandardPlan) {
    return (
      <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="text-sm font-semibold">顧客カスタム項目</h3>
        <p className="mt-2 text-sm text-muted">
          この機��はスタンダードプ��ン以上でご利用いただけます。
        </p>
        <a
          href="/provider/billing"
          className="mt-3 inline-block text-sm font-medium text-accent underline"
        >
          プランをアップグレード
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <h3 className="text-sm font-semibold">顧客カスタム項目</h3>
      <p className="mt-1 text-xs text-muted">
        顧客詳細ページに表示するカスタム項目のラベルを設定できます（最大3つ）
      </p>
      <div className="mt-4 space-y-3">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              {i + 1}
            </span>
            <input
              type="text"
              value={label}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder={`項目${i + 1}（例：アレルギー）`}
              maxLength={20}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "保存中..." : "保存"}
        </button>
        {saved && (
          <span className="text-sm text-accent">保存しま��た</span>
        )}
      </div>
    </div>
  );
}
