"use client";

import { useState, useEffect } from "react";

export default function TestBfcachePage() {
  const [log, setLog] = useState<string[]>([]);
  const [count, setCount] = useState(0);

  function addLog(msg: string) {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
  }

  useEffect(() => {
    addLog("useEffect ran (mount)");

    function handlePageShow(e: PageTransitionEvent) {
      addLog(`pageshow: persisted=${e.persisted}`);
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-lg">
        <h1 className="text-lg font-bold">bfcache テスト</h1>

        {/* このスクリプトはHTML解析時に即座に実行される */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var nav = performance.getEntriesByType('navigation')[0];
              var navType = nav ? nav.type : 'unknown';
              console.log('[inline-script] navigation type:', navType);
              if (navType === 'back_forward') {
                console.log('[inline-script] back_forward detected, reloading');
                window.location.reload();
              }
            } catch(e) {
              console.log('[inline-script] error:', e);
            }
          })();
        `}} />

        <div className="mt-4 space-y-3">
          <button
            onClick={() => {
              setCount((c) => c + 1);
              addLog(`count: ${count + 1}`);
            }}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white"
          >
            カウント: {count}
          </button>

          <a
            href="https://www.google.com"
            className="block rounded-lg bg-red-500 px-4 py-2.5 text-center text-sm font-semibold text-white"
          >
            外部サイトに遷移（Google）
          </a>

          <button
            onClick={() => window.location.href = "https://www.google.com"}
            className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            window.location.href で遷移（Google）
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-card p-4 ring-1 ring-border">
          <p className="mb-2 text-xs font-medium text-muted">ログ</p>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed">
            {log.length === 0 ? "Loading..." : log.join("\n")}
          </pre>
        </div>

        <p className="mt-4 text-xs text-muted">
          手順: 1. カウントを数回クリック → 2. 外部サイトに遷移 → 3. ブラウザバック → 4. 自動リロードされるか確認
        </p>
      </div>
    </main>
  );
}
