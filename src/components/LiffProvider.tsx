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

interface LiffContextValue {
  user: LiffUser | null;
  isReady: boolean;
  isLoggedIn: boolean;
  error: string | null;
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
  const [user, setUser] = useState<LiffUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liffInstance, setLiffInstance] = useState<typeof import("@line/liff").default | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // セッションストレージに既存ユーザーがあればそのまま使う
        const cached = sessionStorage.getItem(SESSION_KEY);
        if (cached) {
          const cachedUser = JSON.parse(cached) as LiffUser;
          setUser(cachedUser);
          setIsLoggedIn(true);
          // LIFFは初期化だけして、サーバー認証はスキップ
          const liff = (await import("@line/liff")).default;
          await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
          setLiffInstance(liff);
          setIsReady(true);
          return;
        }

        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        setLiffInstance(liff);

        // LIFFログイン済み & セッション未作成の場合のみサーバー認証
        if (liff.isLoggedIn()) {
          const accessToken = liff.getAccessToken();
          if (accessToken) {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken }),
            });

            if (res.ok) {
              const { user: serverUser } = await res.json();
              setUser(serverUser);
              setIsLoggedIn(true);
              sessionStorage.setItem(SESSION_KEY, JSON.stringify(serverUser));
            }
          }
        }
      } catch (e) {
        console.error("LIFF init error:", e);
        setError(
          e instanceof Error ? e.message : "LIFF initialization failed"
        );
      } finally {
        setIsReady(true);
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
    <LiffContext.Provider value={{ user, isReady, isLoggedIn, error, login }}>
      {children}
    </LiffContext.Provider>
  );
}
