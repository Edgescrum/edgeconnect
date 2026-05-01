"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMyReview } from "@/lib/actions/survey";

export function DeleteReviewButton({ surveyResponseId }: { surveyResponseId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-xs text-red-500">本当に削除しますか？（元に戻せません）</p>
        <button
          onClick={() => {
            startTransition(async () => {
              const result = await deleteMyReview(surveyResponseId);
              if (result.success) {
                router.refresh();
              }
            });
          }}
          disabled={isPending}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {isPending ? "削除中..." : "削除する"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-muted"
        >
          キャンセル
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-gray-200"
    >
      口コミを削除する
    </button>
  );
}
