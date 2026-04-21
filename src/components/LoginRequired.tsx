"use client";

import { LineIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";

export function LoginRequired({
  message = "この操作にはログインが必要です",
  onClose,
  redirectPath,
}: {
  message?: string;
  onClose?: () => void;
  redirectPath?: string;
}) {
  function handleLogin() {
    import("@line/liff").then((mod) => {
      const liff = mod.default;
      if (liff.isLoggedIn()) {
        window.location.reload();
      } else {
        const path = redirectPath || sessionStorage.getItem("login_redirect") || window.location.pathname;
        sessionStorage.setItem("login_redirect", path);
        localStorage.setItem("login_redirect", path);
        // Middleware用にcookieにも保存（サーバー側でリダイレクト先を判定）
        document.cookie = `login_redirect=${encodeURIComponent(path)}; path=/; max-age=300; SameSite=Lax`;
        liff.login();
      }
    });
  }

  return (
    <Modal open={true} onClose={onClose || (() => window.history.back())}>
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p className="mt-4 font-semibold">{message}</p>
        <p className="mt-1.5 text-sm text-muted">
          LINEアカウントでログインしてください
        </p>
      </div>
      <button
        onClick={handleLogin}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-base font-semibold text-white shadow-lg shadow-success/25 active:scale-[0.98]"
      >
        <LineIcon />
        LINEでログイン
      </button>
      <button
        onClick={onClose || (() => window.history.back())}
        className="mt-3 w-full rounded-xl py-2.5 text-sm text-muted active:bg-background"
      >
        戻る
      </button>
    </Modal>
  );
}
