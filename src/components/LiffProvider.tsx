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
  isFriend: boolean | null; // null=未チェック
  error: string | null;
}

interface LiffContextValue extends LiffState {
  login: () => void;
  checkFriendship: () => Promise<boolean>;
  addFriend: () => void;
}

const LiffContext = createContext<LiffContextValue>({
  user: null,
  isReady: false,
  isLoggedIn: false,
  isFriend: null,
  error: null,
  login: () => {},
  checkFriendship: async () => false,
  addFriend: () => {},
});

export function useLiff() {
  return useContext(LiffContext);
}

const SESSION_KEY = "edgeconnect_user";
const FRIEND_KEY = "edgeconnect_is_friend";

export function LiffProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiffState>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        try {
          const user = JSON.parse(cached) as LiffUser;
          const isFriend = sessionStorage.getItem(FRIEND_KEY) === "1" ? true : null;
          return { user, isReady: true, isLoggedIn: true, isFriend, error: null };
        } catch { /* ignore */ }
      }
    }
    return { user: null, isReady: false, isLoggedIn: false, isFriend: null, error: null };
  });

  const [liffInstance, setLiffInstance] = useState<typeof import("@line/liff").default | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        setLiffInstance(liff);

        if (liff.isLoggedIn()) {
          const accessToken = liff.getAccessToken();
          if (accessToken) {
            const cached = sessionStorage.getItem(SESSION_KEY);

            if (cached) {
              // バックグラウンドでセッション維持
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

  // 友だち追加チェック（予約時に呼ぶ）
  const checkFriendship = useCallback(async (): Promise<boolean> => {
    if (!liffInstance) return false;

    // キャッシュ済み
    const cached = sessionStorage.getItem(FRIEND_KEY);
    if (cached === "1") {
      setState((prev) => ({ ...prev, isFriend: true }));
      return true;
    }

    try {
      const friendship = await liffInstance.getFriendship();
      const isFriend = friendship.friendFlag;
      setState((prev) => ({ ...prev, isFriend }));
      if (isFriend) sessionStorage.setItem(FRIEND_KEY, "1");
      return isFriend;
    } catch {
      return false;
    }
  }, [liffInstance]);

  // 友だち追加画面を開く
  const addFriend = useCallback(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID!;
    // LINE公式アカウントのプロフィールページを開く
    if (liffInstance) {
      liffInstance.openWindow({
        url: `https://line.me/R/ti/p/@${liffId}`,
        external: false,
      });
    }
  }, [liffInstance]);

  return (
    <LiffContext.Provider value={{ ...state, login, checkFriendship, addFriend }}>
      {state.isReady && <div data-liff-ready="true" style={{ display: "none" }} />}
      {children}
    </LiffContext.Provider>
  );
}
