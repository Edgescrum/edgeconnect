"use client";

import { useState, useRef, useCallback } from "react";
import { updateProfile } from "@/lib/actions/provider";
import Image from "next/image";
import { Toggle } from "@/components/Toggle";
import { ImageCropper } from "@/components/ImageCropper";
import { PROVIDER_CATEGORIES } from "@/lib/constants/categories";

interface Provider {
  id: number;
  name: string | null;
  bio: string | null;
  icon_url: string | null;
  line_contact_url: string;
  contact_email: string | null;
  contact_phone: string | null;
  brand_color: string | null;
  category: string | null;
}

// line_contact_url からLINE IDを抽出
function extractLineId(url: string | null): string {
  if (!url) return "";
  const match = url.match(/line\.me\/ti\/p\/~(.+)$/);
  return match ? match[1] : "";
}

export function ProfileEditForm({ provider }: { provider: Provider }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(
    provider.icon_url
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [showIconMenu, setShowIconMenu] = useState(false);
  const [lineEnabled, setLineEnabled] = useState(!!provider.line_contact_url);
  const [lineId, setLineId] = useState(extractLineId(provider.line_contact_url));
  const [emailEnabled, setEmailEnabled] = useState(!!provider.contact_email);
  const [emailValue, setEmailValue] = useState(provider.contact_email || "");
  const [phoneEnabled, setPhoneEnabled] = useState(!!provider.contact_phone);
  const [phoneValue, setPhoneValue] = useState(provider.contact_phone || "");
  const [category, setCategory] = useState(provider.category || "");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCropSrc(URL.createObjectURL(file));
    }
  }

  const handleCrop = useCallback((blob: Blob) => {
    const file = new File([blob], "icon.png", { type: "image/png" });
    setCroppedFile(file);
    setIconPreview(URL.createObjectURL(blob));
    setCropSrc(null);
    // file inputをリセット
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleCropCancel = useCallback(() => {
    setCropSrc(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    // 楽観的: 即座にsuccessを表示
    setSuccess(true);
    try {
      const formData = new FormData(e.currentTarget);
      // クロップ済みファイルがあれば差し替え
      if (croppedFile) {
        formData.set("icon", croppedFile);
      }
      await updateProfile(formData);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      setSuccess(false);
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    {cropSrc && (
      <ImageCropper src={cropSrc} onCrop={handleCrop} onCancel={handleCropCancel} />
    )}
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (iconPreview) {
              setShowIconMenu(true);
            } else {
              fileRef.current?.click();
            }
          }}
          className="relative"
        >
          {iconPreview ? (
            <Image
              src={iconPreview}
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white shadow-md">
              {(provider.name || "?")[0]}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
        </button>
        <input
          ref={fileRef}
          name="icon"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* アイコンメニュー */}
        {showIconMenu && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setShowIconMenu(false)}>
            <div className="w-full max-w-sm rounded-2xl bg-card p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setShowIconMenu(false);
                  // 現在の画像でクロッパーを開く
                  setCropSrc(iconPreview);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left active:bg-accent-bg"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
                  <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9" /><path d="m3 15 4-4 4 4 4-4 4 4" /><path d="M5 21h14" />
                </svg>
                <span className="text-sm font-medium">位置を調整する</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowIconMenu(false);
                  fileRef.current?.click();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left active:bg-accent-bg"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm font-medium">写真を変更する</span>
              </button>
              <button
                type="button"
                onClick={() => setShowIconMenu(false)}
                className="mt-1 w-full rounded-xl py-3 text-center text-sm text-muted active:bg-accent-bg"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          お店の名前
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={provider.name || ""}
          required
          className="w-full rounded-xl border border-border bg-card px-4 py-3"
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">カテゴリ</p>
        <input type="hidden" name="category" value={category} />
        <div className="flex flex-wrap gap-2">
          {PROVIDER_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(category === cat.value ? "" : cat.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                category === cat.value
                  ? "bg-accent text-white"
                  : "bg-card text-muted ring-1 ring-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-sm font-medium">
          自己紹介
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={provider.bio || ""}
          className="w-full rounded-xl border border-border bg-card px-4 py-3"
        />
      </div>

      {/* 連絡方法 */}
      <div>
        <p className="mb-1 text-sm font-medium">お客さまからの連絡方法</p>
        <p className="mb-3 text-xs text-muted">
          ONにするとお客さまの予約詳細画面に連絡ボタンが表示されます。キャンセル期限後のご相談などにご活用ください。
        </p>
        <div className="space-y-3">
          {/* LINE */}
          <div className={`rounded-2xl p-4 ring-1 transition-colors ${
            lineEnabled ? "bg-green-50/50 ring-success/30" : "bg-card ring-border"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#06C755">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">LINEで連絡</p>
              </div>
              <Toggle
                checked={lineEnabled}
                onChange={setLineEnabled}
                ariaLabel="LINEで連絡を有効にする"
              />
            </div>
            {lineEnabled && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm text-muted">@</span>
                  <input
                    name="line_id"
                    type="text"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value.replace(/^@/, ""))}
                    placeholder="your-line-id"
                    required
                    className="w-full rounded-xl border border-border bg-white px-4 py-3"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  LINEアプリの設定 &gt; プロフィール &gt; LINE IDで確認できます
                </p>
              </div>
            )}
            <input type="hidden" name="line_enabled" value={lineEnabled ? "1" : "0"} />
          </div>

          {/* メール */}
          <div className={`rounded-2xl p-4 ring-1 transition-colors ${
            emailEnabled ? "bg-blue-50/50 ring-blue-300/30" : "bg-card ring-border"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">メールで連絡</p>
              </div>
              <Toggle
                checked={emailEnabled}
                onChange={setEmailEnabled}
                activeColor="bg-success"
                ariaLabel="メールで連絡を有効にする"
              />
            </div>
            {emailEnabled && (
              <div className="mt-3">
                <input
                  name="contact_email"
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-border bg-white px-4 py-3"
                />
              </div>
            )}
            <input type="hidden" name="email_enabled" value={emailEnabled ? "1" : "0"} />
          </div>

          {/* 電話 */}
          <div className={`rounded-2xl p-4 ring-1 transition-colors ${
            phoneEnabled ? "bg-orange-50/50 ring-orange-300/30" : "bg-card ring-border"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">電話で連絡</p>
              </div>
              <Toggle
                checked={phoneEnabled}
                onChange={setPhoneEnabled}
                activeColor="bg-success"
                ariaLabel="電話で連絡を有効にする"
              />
            </div>
            {phoneEnabled && (
              <div className="mt-3">
                <input
                  name="contact_phone"
                  type="tel"
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  placeholder="090-1234-5678"
                  inputMode="tel"
                  required
                  className="w-full rounded-xl border border-border bg-white px-4 py-3"
                />
              </div>
            )}
            <input type="hidden" name="phone_enabled" value={phoneEnabled ? "1" : "0"} />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="brand_color" className="mb-1.5 block text-sm font-medium">
          ブランドカラー
          <span className="ml-1 text-xs text-muted">（LINE通知のアクセントカラー）</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            id="brand_color"
            name="brand_color"
            type="color"
            defaultValue={provider.brand_color || "#6366f1"}
            className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-card p-0.5"
          />
          <span className="text-sm text-muted">通知メッセージのボタンやバッジに使用されます</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
          ✓ 保存しました
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
      >
        {submitting && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {submitting ? "処理中..." : "保存する"}
      </button>
    </form>
    </>
  );
}
