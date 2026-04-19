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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const debug = (msg: string) => {
    console.log("[LIFF]", msg);
    setDebugLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
  };

  useEffect(() => {
    debug(`init start | path: ${window.location.pathname} | search: ${window.location.search}`);
    debug(`sessionStorage login_redirect: ${sessionStorage.getItem("login_redirect")}`);
    debug(`localStorage login_redirect: ${localStorage.getItem("login_redirect")}`);
    debug(`sessionStorage cache: ${sessionStorage.getItem(SESSION_KEY) ? "exists" : "none"}`);

    // キャッシュ復元
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      try {
        const user = JSON.parse(cached) as LiffUser;
        setState({ user, isReady: true, isLoggedIn: true, error: null });
        debug("cache restored");
      } catch { /* ignore */ }
    }

    async function init() {
      try {
        debug("importing liff...");
        const liff = (await import("@line/liff")).default;
        debug(`liff imported | LIFF_ID: ${process.env.NEXT_PUBLIC_LIFF_ID}`);
        debug(`full URL: ${window.location.href}`);

        // OAuthパラメータ付きURLではliff.init()がハングするため、パラメータなしURLにリダイレクト
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("code") || urlParams.has("liffClientId")) {
          const liffState = urlParams.get("liff.state");
          const redirect = liffState || localStorage.getItem("login_redirect") || sessionStorage.getItem("login_redirect") || window.location.pathname;
          debug(`OAuth params detected → redirecting to: ${redirect}`);
          // LIFF SDKのloginTmpを削除（残っているとliff.init()がハングする）
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.includes(":loginTmp")) {
              localStorage.removeItem(key);
            }
          }
          window.location.replace(redirect);
          return;
        }

        // LIFF SDKの不完全なログイン状態が残っている場合はクリア
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith("LIFF_STORE:")) {
            debug(`clearing LIFF state: ${key}`);
            localStorage.removeItem(key);
          }
        }

        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        debug(`liff.init done | isLoggedIn: ${liff.isLoggedIn()} | isInClient: ${liff.isInClient()}`);
        setLiffInstance(liff);

        if (liff.isLoggedIn()) {
          const accessToken = liff.getAccessToken();
          debug(`accessToken: ${accessToken ? "exists" : "null"}`);
          if (accessToken) {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken }),
            });
            debug(`/api/auth/login status: ${res.status}`);

            if (res.ok) {
              const { user: serverUser } = await res.json();
              const hadCache = !!sessionStorage.getItem(SESSION_KEY);
              sessionStorage.setItem(SESSION_KEY, JSON.stringify(serverUser));
              setState({ user: serverUser, isReady: true, isLoggedIn: true, error: null });

              debug(`hadCache: ${hadCache}`);

              if (hadCache) {
                // 既にログイン済み → URLクリーンアップのみ
                if (window.location.search) {
                  window.history.replaceState({}, "", window.location.pathname);
                }
                debug("had cache → cleanup only");
                return;
              }

              // 初回ログイン → cookie反映を待ってリダイレクト
              const ssRedirect = sessionStorage.getItem("login_redirect");
              const lsRedirect = localStorage.getItem("login_redirect");
              debug(`ssRedirect: ${ssRedirect} | lsRedirect: ${lsRedirect}`);
              const loginRedirect = ssRedirect || lsRedirect;
              sessionStorage.removeItem("login_redirect");
              localStorage.removeItem("login_redirect");
              const destination = loginRedirect || "/home";
              debug(`navigating to: ${destination}`);
              await new Promise((r) => setTimeout(r, 100));
              window.location.replace(destination);
              return;
            }
          }
        }

        // ?action=login パラメータがある場合、自動でLINE Loginを開始
        const params = new URLSearchParams(window.location.search);
        if (params.get("action") === "login") {
          // 履歴から ?action=login を除去（ブラウザバックで再実行されないように）
          window.history.replaceState({}, "", window.location.pathname);
          debug("triggering liff.login()");
          liff.login();
          return;
        }

        debug("no login → ready");
        setState((prev) => prev.isReady ? prev : { ...prev, isReady: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        debug(`ERROR: ${msg}`);
        console.error("LIFF init error:", e);

        setState((prev) => prev.isReady ? prev : {
          user: null, isReady: true, isLoggedIn: false,
          error: msg,
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
      {debugLogs.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: "40vh",
            overflow: "auto",
            background: "rgba(0,0,0,0.85)",
            color: "#0f0",
            fontSize: "11px",
            fontFamily: "monospace",
            padding: "8px",
            zIndex: 99999,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          <button
            onClick={() => setDebugLogs([])}
            style={{ position: "sticky", top: 0, float: "right", color: "#f66", background: "none", border: "none", fontSize: "14px" }}
          >
            ✕
          </button>
          {debugLogs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </LiffContext.Provider>
  );
}
