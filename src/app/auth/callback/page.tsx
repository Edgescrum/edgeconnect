"use client";

import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("ログイン処理中...");

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("auth_code");
      const redirectUri = params.get("redirect_uri") || window.location.origin;
      const dest = params.get("redirect") || "/home";

      if (!code) {
        setStatus("認証コードがありません");
        setTimeout(() => { window.location.href = "/home"; }, 2000);
        return;
      }

      // LIFF SDKがlocalStorageに保存したcode_verifierを取得
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID!;
      const loginTmpKey = `LIFF_STORE:${liffId}:loginTmp`;
      const loginTmpRaw = localStorage.getItem(loginTmpKey);
      let codeVerifier: string | undefined;

      if (loginTmpRaw) {
        try {
          const loginTmp = JSON.parse(loginTmpRaw);
          codeVerifier = loginTmp.codeVerifier;
        } catch { /* ignore */ }
      }

      // LIFF関連のlocalStorageをクリア
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("LIFF_STORE:")) {
          localStorage.removeItem(key);
        }
      }

      // login_redirect クリア
      sessionStorage.removeItem("login_redirect");
      localStorage.removeItem("login_redirect");
      document.cookie = "login_redirect=; path=/; max-age=0";

      // APIでcode交換（fetchでcookieを受け取る）
      try {
        const res = await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
          }),
        });

        if (res.ok) {
          setStatus("ログイン成功！");
          // フルページリロードでcookieを反映
          window.location.href = dest;
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus(`ログイン失敗: ${data.error || res.status}`);
          setTimeout(() => { window.location.href = "/home"; }, 3000);
        }
      } catch (e) {
        setStatus(`エラー: ${e instanceof Error ? e.message : "不明なエラー"}`);
        setTimeout(() => { window.location.href = "/home"; }, 3000);
      }
    }

    handleCallback();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img src="/logo.svg" alt="PeCo" className="mx-auto h-10" />
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted">{status}</p>
        </div>
      </div>
    </main>
  );
}
