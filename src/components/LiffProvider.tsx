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
const DEBUG_PERF = true; // 本番リリース時にfalseにする

export function LiffProvider({ children }: { children: ReactNode }) {
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
  const [perfLogs, setPerfLogs] = useState<string[]>([]);

  function addLog(msg: string) {
    if (DEBUG_PERF) {
      setPerfLogs((prev) => [...prev, msg]);
    }
  }

  useEffect(() => {
    const pageStart = performance.now();
    addLog(`page load: ${Math.round(pageStart)}ms from origin`);

    async function init() {
      try {
        const t0 = performance.now();

        addLog("1. importing liff...");
        const liff = (await import("@line/liff")).default;
        const importTime = Math.round(performance.now() - t0);
        addLog(`2. liff import: ${importTime}ms`);

        const t1 = performance.now();
        addLog("3. liff.init() starting...");
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        const initTime = Math.round(performance.now() - t1);
        addLog(`4. liff.init(): ${initTime}ms`);
        setLiffInstance(liff);

        addLog(`   isInClient=${liff.isInClient()} isLoggedIn=${liff.isLoggedIn()}`);

        if (sessionStorage.getItem(SESSION_KEY)) {
          addLog(`5. cached → done (${Math.round(performance.now() - t0)}ms total)`);
          return;
        }

        if (liff.isLoggedIn()) {
          const accessToken = liff.getAccessToken();
          if (accessToken) {
            const t2 = performance.now();
            addLog("5. calling /api/auth/login...");
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken }),
            });
            const loginTime = Math.round(performance.now() - t2);
            addLog(`6. /api/auth/login: ${loginTime}ms (status=${res.status})`);

            if (res.ok) {
              const { user: serverUser } = await res.json();
              sessionStorage.setItem(SESSION_KEY, JSON.stringify(serverUser));
              const total = Math.round(performance.now() - t0);
              addLog(`7. done! total: ${total}ms`);
              setState({ user: serverUser, isReady: true, isLoggedIn: true, error: null });
              return;
            }
          }
        }

        addLog(`5. not logged in (${Math.round(performance.now() - t0)}ms)`);
        setState((prev) => prev.isReady ? prev : { ...prev, isReady: true });
      } catch (e) {
        addLog(`ERROR: ${e}`);
        setState((prev) => prev.isReady ? prev : {
          user: null, isReady: true, isLoggedIn: false,
          error: e instanceof Error ? e.message : "LIFF initialization failed",
        });
      }
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(() => {
    if (liffInstance && !liffInstance.isLoggedIn()) {
      liffInstance.login();
    }
  }, [liffInstance]);

  return (
    <LiffContext.Provider value={{ ...state, login }}>
      {children}
      {/* デバッグ用パフォーマンスログ */}
      {DEBUG_PERF && perfLogs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 max-h-40 overflow-auto bg-black/90 p-3 text-[11px] font-mono text-green-400">
          {perfLogs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </LiffContext.Provider>
  );
}
