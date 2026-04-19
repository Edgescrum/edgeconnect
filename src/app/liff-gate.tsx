"use client";

import { useState, useEffect, type ReactNode } from "react";

export function LiffGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [isLiff, setIsLiff] = useState<boolean | null>(null);

  useEffect(() => {
    // ハッシュにcontext_tokenがある = LINEアプリ内からのLIFFアクセス
    setIsLiff(window.location.hash.includes("context_token="));
  }, []);

  // 初回レンダリング（SSR）時はchildrenを返さず何も表示しない（フラッシュ防止）
  if (isLiff === null) return null;
  if (isLiff) return <>{fallback}</>;
  return <>{children}</>;
}
