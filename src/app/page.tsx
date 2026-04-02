"use client";

import { useLiff } from "@/components/LiffProvider";

export default function Home() {
  const { user, isReady, isLoggedIn, error, login } = useLiff();

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">EdgeConnect</h1>
      <p className="mb-6 text-gray-600">予約管理プラットフォーム</p>

      {!isReady && <p className="text-gray-500">読み込み中...</p>}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          <p>{error}</p>
        </div>
      )}

      {isReady && !isLoggedIn && (
        <button
          onClick={login}
          className="w-full rounded-lg bg-[#06C755] py-3 font-semibold text-white"
        >
          LINEでログイン
        </button>
      )}

      {isLoggedIn && user && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">{user.displayName}</p>
            <p className="text-sm text-gray-500">ログイン中</p>
          </div>
          <a
            href="/provider/register"
            className="block w-full rounded-lg bg-black py-3 text-center font-semibold text-white"
          >
            事業主として登録する
          </a>
        </div>
      )}
    </main>
  );
}
