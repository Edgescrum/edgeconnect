"use client";

export default function ExploreError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-3xl">&#x1f6e0;&#xfe0f;</p>
      <h2 className="mt-4 text-lg font-semibold">
        ページの読み込みに失敗しました
      </h2>
      <p className="mt-2 text-sm text-muted">
        しばらくしてからもう一度お試しください
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
      >
        再読み込み
      </button>
    </div>
  );
}
