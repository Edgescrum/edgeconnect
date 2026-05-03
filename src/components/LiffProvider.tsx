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

const SESSION_KEY = "peco_user";

// Memoize the LIFF import so remounts don't re-import the ~150KB SDK
let liffPromise: Promise<typeof import("@line/liff")["default"]> | null = null;
function getLiff() {
  if (!liffPromise) liffPromise = import("@line/liff").then((m) => m.default);
  return liffPromise;
}

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
        // Public routes (/p/[slug]) still need LIFF init to create server session
        // after first login. Only skip if user has no session AND no LIFF context.
        const path = window.location.pathname;
        const isPublicRoute = path.startsWith("/p/") && !path.includes("/book/");
        const isInLiffBrowser = navigator.userAgent.includes("LIFF") ||
          navigator.userAgent.includes("Line");
        if (isPublicRoute && !isInLiffBrowser && !cached) {
          // External browser, no session = truly anonymous visitor
          setState((prev) => prev.isReady ? prev : { ...prev, isReady: true });
          return;
        }

        const liff = await getLiff();
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
                if (window.location.search || window.location.hash) {
                  window.history.replaceState({}, "", window.location.pathname);
                }
                return;
              }

              // 初回ログイン → リダイレクト
              const loginRedirect = sessionStorage.getItem("login_redirect")
                || localStorage.getItem("login_redirect");
              sessionStorage.removeItem("login_redirect");
              localStorage.removeItem("login_redirect");
              // LIFFアプリ内から/に来た場合は/homeにリダイレクト
              const destination = loginRedirect || (window.location.pathname === "/" ? "/home" : null);
              if (destination && destination !== window.location.pathname) {
                await new Promise((r) => setTimeout(r, 100));
                window.location.replace(destination);
                return;
              }
              // 初回ログインで同じページに留まる場合（/p/[slug]等）
              // サーバーコンポーネントのisLoggedInを更新するためリロード
              if (!hadCache) {
                window.location.reload();
                return;
              }
              // URLクリーンアップ（ハッシュフラグメント含む）
              if (window.location.search || window.location.hash) {
                window.history.replaceState({}, "", window.location.pathname);
              }
              return;
            } else {
              const errData = await res.json().catch(() => ({}));
              console.error("[LIFF] server login failed:", res.status, errData);
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

                // login_redirectがあればリダイレクト（現在のページと異なる場合のみ）
                const loginRedirect = sessionStorage.getItem("login_redirect")
                  || localStorage.getItem("login_redirect");
                if (loginRedirect && loginRedirect !== window.location.pathname) {
                  sessionStorage.removeItem("login_redirect");
                  localStorage.removeItem("login_redirect");
                  window.location.replace(loginRedirect);
                  return;
                }
                sessionStorage.removeItem("login_redirect");
                localStorage.removeItem("login_redirect");

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
