"use client";

import Image from "next/image";
import { useState } from "react";

interface ProviderAvatarProps {
  iconUrl: string | null | undefined;
  name: string | null | undefined;
  size: number;
  className?: string;
}

/**
 * 事業主アイコンの表示コンポーネント。
 * icon_url が設定されている場合は画像を表示し、
 * 画像の読み込みに失敗した場合やURLが未設定の場合は
 * 人型シルエットのデフォルトアイコンをフォールバックとして表示する。
 */
export function ProviderAvatar({ iconUrl, name, size, className = "" }: ProviderAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (iconUrl && !imgError) {
    return (
      <Image
        src={iconUrl}
        alt={name || ""}
        width={size}
        height={size}
        className={`object-cover ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gray-300 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="white"
        style={{ width: size * 0.6, height: size * 0.6 }}
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M12 14c-6 0-8 3-8 5v1h16v-1c0-2-2-5-8-5z" />
      </svg>
    </div>
  );
}
