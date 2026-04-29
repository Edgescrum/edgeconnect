"use client";

import { useState, useEffect } from "react";

export function RegisterCompleteModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const flag = sessionStorage.getItem("peco_register_complete");
    if (flag === "1") {
      sessionStorage.removeItem("peco_register_complete");
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-xl ring-1 ring-border animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-600"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold">登録が完了しました</h2>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          予約ページが作成されました。<br />
          サービスメニューの追加や営業時間の設定を行い、<br />
          QRコードをお客さまに共有しましょう。
        </p>
        <button
          onClick={() => setShow(false)}
          className="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white active:scale-[0.98]"
        >
          はじめる
        </button>
      </div>
    </div>
  );
}
