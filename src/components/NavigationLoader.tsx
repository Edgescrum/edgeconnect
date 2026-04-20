"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  // pathname変更でローディング解除
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  const startLoading = useCallback(() => setLoading(true), []);

  // リンククリック・ボタンクリックを検知
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // <a>タグの検知
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (!href) return;

        if (
          href.startsWith("http") ||
          href.startsWith("#") ||
          href.startsWith("blob:") ||
          href.startsWith("data:") ||
          href.startsWith("line://") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("webcal://") ||
          anchor.target === "_blank" ||
          anchor.hasAttribute("download")
        ) {
          return;
        }

        if (href === pathname) return;
        setLoading(true);
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  // グローバルにstartLoadingを公開（router.pushなどで使える）
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__startNavLoading = startLoading;
    return () => { delete (window as unknown as Record<string, unknown>).__startNavLoading; };
  }, [startLoading]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      <div className="h-1 w-full overflow-hidden bg-accent/30">
        <div
          className="h-full bg-accent"
          style={{ animation: "navProgress 1s ease-in-out infinite" }}
        />
      </div>
      <style>{`
        @keyframes navProgress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
