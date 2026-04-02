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

export function LiffProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LiffUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liffInstance, setLiffInstance] = useState<typeof import("@line/liff").default | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        setLiffInstance(liff);

        // 既にログイン済みならサーバー認証を実行
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

  // 明示的に呼ばれた時のみログインを実行
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
