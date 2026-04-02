"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface LiffUser {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
}

interface LiffState {
  user: LiffUser | null;
  isReady: boolean;
  isLoggedIn: boolean;
  error: string | null;
}

interface LiffContextValue extends LiffState {
  login: () => void;
}

const LiffContext = createContext<LiffContextValue>({
  user: null,
  isReady: false,
  isLoggedIn: false,
  error: null,
  login: () => {},
});

export function useLiff() {
  return useContext(LiffContext);
}

const SESSION_KEY = "edgeconnect_user";

export function LiffProvider({ children }: { children: ReactNode }) {
  // キャッシュがあれば初期値として即座に設定（LIFF init不要）
  const [state, setState] = useState<LiffState>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        try {
          const user = JSON.parse(cached) as LiffUser;
          return { user, isReady: true, isLoggedIn: true, error: null };
        } catch { /* ignore */ }
      }
    }
    return { user: null, isReady: false, isLoggedIn: false, error: null };
  });

  const [liffInstance, setLiffInstance] = useState<typeof import("@line/liff").default | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const t0 = performance.now();
        const liff = (await import("@line/liff")).default;
        console.log(`[PERF] liff import: ${Math.round(performance.now() - t0)}ms`);

        const t1 = performance.now();
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        console.log(`[PERF] liff.init: ${Math.round(performance.now() - t1)}ms`);
        setLiffInstance(liff);

        // キャッシュ済みならLIFF initだけで完了（サーバー認証スキップ）
        if (sessionStorage.getItem(SESSION_KEY)) {
          console.log(`[PERF] total (cached): ${Math.round(performance.now() - t0)}ms`);
          return;
        }

        // LIFFログイン済みならサーバー認証
        if (liff.isLoggedIn()) {
          const accessToken = liff.getAccessToken();
          if (accessToken) {
            const t2 = performance.now();
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken }),
            });
            console.log(`[PERF] /api/auth/login: ${Math.round(performance.now() - t2)}ms`);
            if (res.ok) {
              const { user: serverUser } = await res.json();
              sessionStorage.setItem(SESSION_KEY, JSON.stringify(serverUser));
              console.log(`[PERF] total (fresh): ${Math.round(performance.now() - t0)}ms`);
              setState({ user: serverUser, isReady: true, isLoggedIn: true, error: null });
              return;
            }
          }
        }

        // 未ログイン
        setState((prev) => prev.isReady ? prev : { ...prev, isReady: true });
      } catch (e) {
        console.error("LIFF init error:", e);
        setState((prev) => prev.isReady ? prev : {
          user: null,
          isReady: true,
          isLoggedIn: false,
          error: e instanceof Error ? e.message : "LIFF initialization failed",
        });
      }
    }

    init();
  }, []);

  const login = useCallback(() => {
    if (liffInstance && !liffInstance.isLoggedIn()) {
      liffInstance.login();
    }
  }, [liffInstance]);

  return (
    <LiffContext.Provider value={{ ...state, login }}>
      {children}
    </LiffContext.Provider>
  );
}
