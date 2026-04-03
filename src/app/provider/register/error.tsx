"use client";

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-red-50 p-6 text-center">
        <p className="text-lg font-bold text-red-600">エラーが発生しました</p>
        <p className="mt-2 break-all text-xs text-red-500">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
        >
          再試行
        </button>
        <a href="/" className="mt-3 block text-sm text-muted">
          トップに戻る
        </a>
      </div>
    </main>
  );
}
