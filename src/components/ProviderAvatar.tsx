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
    <Image
      src="/images/default-avatar.svg"
      alt={name || ""}
      width={size}
      height={size}
      className={`object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
