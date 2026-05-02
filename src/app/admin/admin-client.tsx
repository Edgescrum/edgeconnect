"use client";

import { useState, useEffect } from "react";
import liff from "@line/liff";

export function AdminClient() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: number; line_user_id: string; display_name: string | null; role: string }>>([]);
  const [liffReady, setLiffReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) return;
    liff.init({ liffId }).then(() => {
      setLiffReady(true);
      if (liff.isLoggedIn()) {
        setAccessToken(liff.getAccessToken());
      }
    }).catch(() => {
      // LIFF init failed - not in LIFF context
    });
  }, []);;

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/admin/api/users");
      const data = await res.json();
      setUsers(data.users || []);
      setStatus(`${data.users?.length || 0} 件のユーザーを取得`);
    } catch (e) {
      setStatus(`エラー: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAllUsers() {
    if (!confirm("全ユーザーデータを削除しますか？この操作は元に戻せません。")) return;
    setLoading(true);
    try {
      const res = await fetch("/admin/api/users", { method: "DELETE" });
      const data = await res.json();
      setUsers([]);
      setStatus(data.message || "削除完了");
    } catch (e) {
      setStatus(`エラー: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(userId: number) {
    if (!confirm(`ユーザー ID:${userId} を削除しますか？`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/admin/api/users?id=${userId}`, { method: "DELETE" });
      const data = await res.json();
      setUsers(users.filter((u) => u.id !== userId));
      setStatus(data.message || "削除完了");
    } catch (e) {
      setStatus(`エラー: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  function fullLogout() {
    // 1. Cookie 削除
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    // 2. Storage クリア
    localStorage.clear();
    sessionStorage.clear();

    // 3. サーバー側ログアウト
    fetch("/api/auth/logout", { method: "POST" })
      .then(() => {
        setStatus("完全ログアウト完了（Cookie・Storage・セッション削除済み）");
        setTimeout(() => window.location.href = "/", 1500);
      })
      .catch((e) => setStatus(`エラー: ${e}`));
  }

  function clearCacheOnly() {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    setStatus("Cookie・localStorage・sessionStorage をクリアしました");
  }

  async function deauthorize() {
    if (!accessToken) {
      setStatus("LIFFにログインしていないため、アクセストークンを取得できません");
      return;
    }
    if (!confirm("LINE認可を取り消しますか？再ログイン時に同意画面が再表示されます。")) return;
    setLoading(true);
    try {
      const res = await fetch("/admin/api/deauthorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAccessToken: accessToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`✓ ${data.message}`);
      } else {
        setStatus(`エラー: ${data.error}`);
      }
    } catch (e) {
      setStatus(`エラー: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold">Admin - Dev Tools</h1>
          <p className="mt-1 text-xs text-muted">staging 環境専用の管理ページです</p>
        </div>

        {status && (
          <div className="rounded-lg border border-border bg-card p-3 text-sm">
            {status}
          </div>
        )}

        {/* セッション管理 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold">セッション管理</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fullLogout}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white active:scale-[0.98]"
            >
              完全ログアウト
            </button>
            <button
              onClick={clearCacheOnly}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold active:scale-[0.98]"
            >
              Cookie・Storage クリアのみ
            </button>
          </div>
          <p className="text-xs text-muted">
            完全ログアウト: Cookie + localStorage + sessionStorage + Supabase Auth セッションを全て削除してトップに遷移
          </p>
        </section>

        {/* ユーザー管理 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold">ユーザー管理</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold active:scale-[0.98] disabled:opacity-50"
            >
              ユーザー一覧を取得
            </button>
            <button
              onClick={deleteAllUsers}
              disabled={loading}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50"
            >
              全ユーザー削除
            </button>
          </div>

          {users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">LINE ID</th>
                    <th className="py-2 pr-3">名前</th>
                    <th className="py-2 pr-3">ロール</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-mono text-xs">{u.id}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{u.line_user_id.slice(0, 10)}...</td>
                      <td className="py-2 pr-3">{u.display_name || "-"}</td>
                      <td className="py-2 pr-3">{u.role}</td>
                      <td className="py-2">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* LINE認可管理 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold">LINE認可管理</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={deauthorize}
              disabled={loading || !accessToken}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50"
            >
              LINE認可を取り消す（自分）
            </button>
            {!liffReady && <span className="text-xs text-muted">LIFF未初期化</span>}
            {liffReady && !accessToken && <span className="text-xs text-muted">LIFFログインなし</span>}
            {accessToken && <span className="text-xs text-green-600">トークン取得済み</span>}
          </div>
          <p className="text-xs text-muted">
            現在ログイン中のユーザーのLINE認可を取り消します。取り消し後は初回同意画面が再表示されます。
          </p>
        </section>

        {/* 環境情報 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold">環境情報</h2>
          <div className="rounded-lg border border-border bg-card p-3 font-mono text-xs">
            <p>VERCEL_ENV: {process.env.NEXT_PUBLIC_VERCEL_ENV || "local"}</p>
            <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "not set"}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
