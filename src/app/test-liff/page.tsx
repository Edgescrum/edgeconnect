"use client";

import { useState, useEffect } from "react";

export default function TestLiffPage() {
  const [log, setLog] = useState<string[]>([]);
  const [liff, setLiff] = useState<typeof import("@line/liff").default | null>(null);

  function addLog(msg: string) {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
  }

  function dumpStorage() {
    addLog("--- localStorage全件 ---");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      const val = localStorage.getItem(key) || "";
      addLog(`  ${key} = ${val.slice(0, 80)}${val.length > 80 ? "..." : ""}`);
    }
    if (localStorage.length === 0) addLog("  (empty)");
    addLog("--- sessionStorage全件 ---");
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)!;
      const val = sessionStorage.getItem(key) || "";
      addLog(`  ${key} = ${val.slice(0, 80)}${val.length > 80 ? "..." : ""}`);
    }
    if (sessionStorage.length === 0) addLog("  (empty)");
  }

  // E: autorunモード（URLに?autorun=1がある場合、LiffProviderのliff.init()だけで結果を確認）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autorun") === "1") {
      // LiffProviderが先にliff.init()を呼ぶので、少し待ってから状態を確認
      addLog("=== E: autorunモード（LiffProviderのliff.init()結果を確認）===");
      addLog(`URL: ${window.location.href}`);
      dumpStorage();

      const check = async () => {
        // LiffProviderのliff.init()完了を待つ
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 500));
          const liffModule = (await import("@line/liff")).default;
          try {
            // liff.getOS()はinit後しか呼べない
            liffModule.getOS();
            addLog(`LiffProvider init完了 (${(i + 1) * 500}ms後)`);
            addLog(`  isLoggedIn: ${liffModule.isLoggedIn()}`);
            addLog(`  isInClient: ${liffModule.isInClient()}`);
            addLog(`  OS: ${liffModule.getOS()}`);
            if (liffModule.isLoggedIn()) {
              const token = liffModule.getAccessToken();
              addLog(`  accessToken: ${token ? token.slice(0, 10) + "..." : "null"}`);
            }
            setLiff(liffModule);
            addLog("--- localStorage（init後）---");
            for (let j = 0; j < localStorage.length; j++) {
              const key = localStorage.key(j)!;
              const val = localStorage.getItem(key) || "";
              addLog(`  ${key} = ${val.slice(0, 80)}${val.length > 80 ? "..." : ""}`);
            }
            return;
          } catch {
            // まだinit完了していない
          }
        }
        addLog("LiffProvider init: 10秒待っても完了しなかった");
      };
      check();
    }
  }, []);

  async function runInit(testMode: "normal" | "stripped" | "monitor" | "clean") {
    setLog([]);

    addLog(`=== テスト: ${testMode} ===`);
    addLog(`URL: ${window.location.href}`);
    addLog(`LIFF_ID: ${process.env.NEXT_PUBLIC_LIFF_ID}`);

    const params = new URLSearchParams(window.location.search);
    const hasOAuth = params.has("code") || params.has("liffClientId");
    addLog(`OAuth params: ${hasOAuth ? "あり" : "なし"}`);

    dumpStorage();

    if (testMode === "stripped" && hasOAuth) {
      addLog("OAuthパラメータを除去中...");
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (testMode === "clean") {
      addLog("全LIFF_STORE削除中...");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("LIFF_STORE:")) {
          addLog(`  削除: ${key}`);
          localStorage.removeItem(key);
        }
      }
    }

    // fetch/XHR監視
    const origFetch = window.fetch;
    const origXHROpen = XMLHttpRequest.prototype.open;
    if (testMode === "monitor" || testMode === "clean") {
      addLog("--- fetch/XHR 監視ON ---");
      window.fetch = async function (...args: Parameters<typeof fetch>) {
        const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
        addLog(`[fetch→] ${url.slice(0, 120)}`);
        try {
          const res = await origFetch.apply(this, args);
          addLog(`[fetch←] ${res.status} ${url.slice(0, 80)}`);
          return res;
        } catch (e) {
          addLog(`[fetch✕] ${e}`);
          throw e;
        }
      };
      const patchedOpen = function (this: XMLHttpRequest, method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
        addLog(`[XHR] ${method} ${String(url).slice(0, 120)}`);
        return origXHROpen.call(this, method, url, async ?? true, username, password);
      };
      XMLHttpRequest.prototype.open = patchedOpen as typeof XMLHttpRequest.prototype.open;
    }

    addLog("1. importing liff...");
    const liffModule = (await import("@line/liff")).default;
    addLog(`   version: ${liffModule.getVersion?.() || "unknown"}`);

    addLog("2. liff.init() starting...");
    const initStart = Date.now();
    try {
      await Promise.race([
        liffModule.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT (15s)")), 15000)),
      ]);
      addLog(`3. liff.init() 成功 (${Date.now() - initStart}ms)`);
      addLog(`   isLoggedIn: ${liffModule.isLoggedIn()}`);
      addLog(`   isInClient: ${liffModule.isInClient()}`);
      addLog(`   OS: ${liffModule.getOS()}`);

      if (liffModule.isLoggedIn()) {
        const token = liffModule.getAccessToken();
        addLog(`4. accessToken: ${token ? token.slice(0, 10) + "..." : "null"}`);
        try {
          const profile = await liffModule.getProfile();
          addLog(`5. profile: ${profile.displayName} (${profile.userId})`);
        } catch (e) {
          addLog(`5. getProfile error: ${e}`);
        }
      } else {
        addLog("4. not logged in");
      }
      setLiff(liffModule);
    } catch (e) {
      addLog(`3. liff.init() 失敗 (${Date.now() - initStart}ms): ${e instanceof Error ? e.message : e}`);
      addLog("--- localStorage（失敗後）---");
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        const val = localStorage.getItem(key) || "";
        addLog(`  ${key} = ${val.slice(0, 80)}${val.length > 80 ? "..." : ""}`);
      }
      setLiff(liffModule);
    }

    window.fetch = origFetch;
    XMLHttpRequest.prototype.open = origXHROpen;
  }

  async function handleFullLogout() {
    addLog(">> Full logout starting...");
    if (liff && liff.isLoggedIn()) {
      liff.logout();
      addLog(">> LIFF logout done");
    }
    await fetch("/api/auth/logout", { method: "POST" });
    addLog(">> Server logout done");
    sessionStorage.clear();
    addLog(">> sessionStorage cleared");
    const keyCount = localStorage.length;
    localStorage.clear();
    addLog(`>> localStorage cleared (${keyCount} keys)`);
    addLog(">> All done. Reloading...");
    setTimeout(() => window.location.href = "/test-liff", 1000);
  }

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-lg">
        <h1 className="text-lg font-bold">LIFF デバッグ</h1>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">liff.init() テスト</p>
          <button
            onClick={() => runInit("normal")}
            className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            A: そのままliff.init()
          </button>
          <button
            onClick={() => runInit("stripped")}
            className="w-full rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            B: OAuthパラメータ除去してからliff.init()
          </button>
          <button
            onClick={() => runInit("monitor")}
            className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            D: fetch/XHR監視つきでliff.init()
          </button>
          <button
            onClick={() => runInit("clean")}
            className="w-full rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            F: LIFF_STORE全削除してからliff.init()（監視つき）
          </button>
          <button
            onClick={() => {
              addLog(">> 全Storage削除 → ?autorun=1でリロード");
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = "/test-liff?autorun=1";
            }}
            className="w-full rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            E: 全削除→リロード（liff.init()1回だけ）
          </button>

          <hr className="border-border" />

          <button
            onClick={handleFullLogout}
            className="w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            完全ログアウト
          </button>
          <button
            onClick={() => {
              if (liff && !liff.isLoggedIn()) {
                addLog(">> liff.login() calling...");
                liff.login({ redirectUri: window.location.origin + "/test-liff" });
              } else {
                addLog(">> already logged in or LIFF not ready");
              }
            }}
            className="w-full rounded-xl bg-[#06C755] px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            LINEでログイン
          </button>
          <button
            onClick={() => dumpStorage()}
            className="w-full rounded-xl bg-gray-400 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            Storage表示
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-card p-4 ring-1 ring-border">
          <p className="mb-2 text-xs font-medium text-muted">ログ</p>
          <pre className="whitespace-pre-wrap break-all text-[10px] leading-relaxed">
            {log.length === 0 ? "ボタンを押してテスト開始" : log.join("\n")}
          </pre>
        </div>
      </div>
    </main>
  );
}
