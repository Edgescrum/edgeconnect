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
  const [state, setState] = useState<LiffState>({
    user: null,
    isReady: false,
    isLoggedIn: false,
    error: null,
  });
  const [liffInstance, setLiffInstance] = useState<typeof import("@line/liff").default | null>(null);

  useEffect(() => {
    // キャッシュ復元
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      try {
        const user = JSON.parse(cached) as LiffUser;
        setState({ user, isReady: true, isLoggedIn: true, error: null });
      } catch { /* ignore */ }
    }

    async function init() {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        setLiffInstance(liff);

        console.log("[LIFF] isLoggedIn:", liff.isLoggedIn(), "URL:", window.location.pathname);

        if (liff.isLoggedIn()) {
          // LIFFログイン済み → サーバーセッション作成
          const accessToken = liff.getAccessToken();
          if (accessToken) {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken }),
            });

            if (res.ok) {
              const { user: serverUser } = await res.json();
              const hadCache = !!sessionStorage.getItem(SESSION_KEY);
              sessionStorage.setItem(SESSION_KEY, JSON.stringify(serverUser));
              setState({ user: serverUser, isReady: true, isLoggedIn: true, error: null });

              if (hadCache) {
                if (window.location.search) {
                  window.history.replaceState({}, "", window.location.pathname);
                }
                return;
              }

              // 初回ログイン → リダイレクト
              const loginRedirect = sessionStorage.getItem("login_redirect")
                || localStorage.getItem("login_redirect");
              sessionStorage.removeItem("login_redirect");
              localStorage.removeItem("login_redirect");
              const destination = loginRedirect || "/home";
              await new Promise((r) => setTimeout(r, 100));
              window.location.replace(destination);
              return;
            }
          }
        }

        // サーバーサイドOAuth callback経由でログイン済みの場合をチェック
        // （liff.isLoggedIn()はfalseだがcookieでセッションがある場合）
        if (!liff.isLoggedIn() && !cached) {
          try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                const serverUser: LiffUser = {
                  lineUserId: data.user.id?.toString() || "",
                  displayName: data.user.displayName || "",
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(serverUser));
                setState({ user: serverUser, isReady: true, isLoggedIn: true, error: null });

                // login_redirectがあればリダイレクト
                const loginRedirect = sessionStorage.getItem("login_redirect")
                  || localStorage.getItem("login_redirect");
                if (loginRedirect) {
                  sessionStorage.removeItem("login_redirect");
                  localStorage.removeItem("login_redirect");
                  window.location.replace(loginRedirect);
                  return;
                }

                // URLクリーンアップ
                if (window.location.search) {
                  window.history.replaceState({}, "", window.location.pathname);
                }
                return;
              }
            }
          } catch { /* /api/auth/me not available */ }
        }

        // ?action=login パラメータがある場合、自動でLINE Loginを開始
        const params = new URLSearchParams(window.location.search);
        if (params.get("action") === "login") {
          window.history.replaceState({}, "", window.location.pathname);
          liff.login();
          return;
        }

        setState((prev) => prev.isReady ? prev : { ...prev, isReady: true });
      } catch (e) {
        console.error("LIFF init error:", e);
        setState((prev) => prev.isReady ? prev : {
          user: null, isReady: true, isLoggedIn: false,
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
