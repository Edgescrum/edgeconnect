"use client";

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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3.5 font-semibold text-white active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              友だち追加してから予約する
            </a>
          )}
          <button
            onClick={onSubmit}
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
  );
}
