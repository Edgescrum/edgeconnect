"use client";

import { LineIcon } from "@/components/icons";
import { Spinner } from "@/components/Spinner";

interface FriendPromptModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  lineBasicId: string | undefined;
}

export function FriendPromptModal({
  show,
  onClose,
  onSubmit,
  submitting,
  lineBasicId,
}: FriendPromptModalProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
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
          {lineBasicId && (
            <a
              href={`https://line.me/R/ti/p/${lineBasicId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 font-semibold text-white active:scale-[0.98]"
            >
              <LineIcon size={18} />
              友だち追加してから予約する
            </a>
          )}
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3.5 font-semibold text-muted active:scale-[0.98]"
          >
            {submitting && (
              <Spinner size="sm" className="border-current border-t-transparent" />
            )}
            {submitting ? "処理中..." : "友だち追加せずに予約する"}
          </button>
        </div>
      </div>
    </div>
  );
}
