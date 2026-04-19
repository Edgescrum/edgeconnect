"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// ページ遷移時にグローバルローディングバーを表示
export function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  // pathname変更でローディング解除
  useEffect(() => {
    setLoading(false);
  }, [pathname]);


  // リンククリックを検知してローディング開始
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;

      if (!anchor) return;
      if (e.defaultPrevented) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      // 外部リンク、ハッシュリンク、line://スキームはスキップ
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

      // 同一ページはスキップ
      if (href === pathname) return;

      setLoading(true);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      <div className="h-0.5 w-full bg-border">
        <div
          className="h-full bg-accent animate-pulse"
          style={{
            animation: "navProgress 2s ease-in-out infinite",
            width: "70%",
          }}
        />
      </div>
      <style>{`
        @keyframes navProgress {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 0; }
          100% { width: 100%; margin-left: 0; }
        }
      `}</style>
    </div>
  );
}
