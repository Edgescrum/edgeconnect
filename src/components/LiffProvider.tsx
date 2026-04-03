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
  isFriend: boolean | null;
  error: string | null;
}

interface LiffContextValue extends LiffState {
  login: () => void;
  checkFriendship: () => Promise<boolean>;
}

const LiffContext = createContext<LiffContextValue>({
  user: null,
  isReady: false,
  isLoggedIn: false,
  isFriend: null,
  error: null,
  login: () => {},
  checkFriendship: async () => false,
});

export function useLiff() {
  return useContext(LiffContext);
}

const SESSION_KEY = "edgeconnect_user";
const FRIEND_KEY = "edgeconnect_is_friend";

export function LiffProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiffState>({
    user: null,
    isReady: false,
    isLoggedIn: false,
    isFriend: null,
    error: null,
  });
  const [mounted, setMounted] = useState(false);
  const [liffInstance, setLiffInstance] = useState<typeof import("@line/liff").default | null>(null);

  useEffect(() => {
    setMounted(true);

    // キャッシュ復元
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      try {
        const user = JSON.parse(cached) as LiffUser;
        const isFriend = sessionStorage.getItem(FRIEND_KEY) === "1" ? true : null;
        setState({ user, isReady: true, isLoggedIn: true, isFriend, error: null });
      } catch { /* ignore */ }
    }

    async function init() {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        setLiffInstance(liff);

        if (liff.isLoggedIn()) {
          const accessToken = liff.getAccessToken();
          if (accessToken) {
            if (sessionStorage.getItem(SESSION_KEY)) {
              fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken }),
              }).catch(() => {});
              return;
            }

            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken }),
            });

            if (res.ok) {
              const { user: serverUser } = await res.json();
              sessionStorage.setItem(SESSION_KEY, JSON.stringify(serverUser));
              setState({ user: serverUser, isReady: true, isLoggedIn: true, isFriend: null, error: null });
              return;
            }
          }
        }

        setState((prev) => prev.isReady ? prev : { ...prev, isReady: true });
      } catch (e) {
        console.error("LIFF init error:", e);
        setState((prev) => prev.isReady ? prev : {
          user: null, isReady: true, isLoggedIn: false, isFriend: null,
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

  const checkFriendship = useCallback(async (): Promise<boolean> => {
    // キャッシュ確認
    if (sessionStorage.getItem(FRIEND_KEY) === "1") {
      setState((prev) => ({ ...prev, isFriend: true }));
      return true;
    }

    // stateからlineUserIdを取得
    const lineUserId = state.user?.lineUserId;
    if (!lineUserId) return false;

    try {
      // サーバーサイドでMessaging API経由で友だち状態を確認
      const res = await fetch(`/api/auth/check-friend?lineUserId=${lineUserId}`);
      if (!res.ok) return false;
      const { isFriend } = await res.json();
      setState((prev) => ({ ...prev, isFriend }));
      if (isFriend) sessionStorage.setItem(FRIEND_KEY, "1");
      return isFriend;
    } catch (e) {
      console.error("checkFriendship error:", e);
      return false;
    }
  }, [state.user?.lineUserId]);

  if (!mounted) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f8fafc",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 36, height: 36, margin: "0 auto",
            border: "3px solid #e2e8f0", borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>読み込み中...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <LiffContext.Provider value={{ ...state, login, checkFriendship }}>
      {children}
    </LiffContext.Provider>
  );
}
