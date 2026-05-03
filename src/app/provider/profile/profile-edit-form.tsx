"use client";

import { useState, useRef, useCallback } from "react";
import { updateProfile } from "@/lib/actions/provider";
import Image from "next/image";
import { ProviderAvatar } from "@/components/ProviderAvatar";
import { ImageCropper } from "@/components/ImageCropper";
import type { Category } from "@/lib/constants/categories";
import { CategorySelector } from "@/components/CategorySelector";
import { brand } from "@/lib/brand";
import { Spinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { ContactMethodToggles, type ContactMethodState } from "@/components/ContactMethodToggles";
import { FormLabel, FormInput, FormTextarea } from "@/components/FormField";
import { PREFECTURES } from "@/lib/constants/prefectures";

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
  prefecture: string | null;
  is_listed: boolean;
}

// line_contact_url からLINE IDを抽出
function extractLineId(url: string | null): string {
  if (!url) return "";
  const match = url.match(/line\.me\/ti\/p\/~(.+)$/);
  return match ? match[1] : "";
}

export function ProfileEditForm({ provider, categories: PROVIDER_CATEGORIES }: { provider: Provider; categories: Category[] }) {
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
  const [contactMethod, setContactMethod] = useState<ContactMethodState>({
    lineEnabled: !!provider.line_contact_url,
    lineId: extractLineId(provider.line_contact_url),
    emailEnabled: !!provider.contact_email,
    contactEmail: provider.contact_email || "",
    phoneEnabled: !!provider.contact_phone,
    contactPhone: provider.contact_phone || "",
  });
  const [category, setCategory] = useState(provider.category || "");
  const [prefecture, setPrefecture] = useState(provider.prefecture || "");
  const [isListed, setIsListed] = useState(provider.is_listed);

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

    // 連絡先が1つも設定されていない場合
    if (!contactMethod.lineEnabled && !contactMethod.emailEnabled && !contactMethod.phoneEnabled) {
      setError("連絡方法を1つ以上設定してください");
      return;
    }

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
            <ProviderAvatar
              iconUrl={null}
              name={provider.name}
              size={80}
              className="rounded-2xl shadow-md"
            />
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
        <Modal open={showIconMenu} onClose={() => setShowIconMenu(false)} position="bottom" padding="p-2">
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
        </Modal>
      </div>

      <div>
        <FormLabel htmlFor="name">お店の名前</FormLabel>
        <FormInput
          id="name"
          name="name"
          type="text"
          defaultValue={provider.name || ""}
          required
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">カテゴリ</p>
        <input type="hidden" name="category" value={category} />
        <CategorySelector
          categories={PROVIDER_CATEGORIES}
          selected={category ? [category] : []}
          onChange={(sel) => setCategory(sel[0] || "")}
          placeholder="カテゴリを選択"
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">都道府県</p>
        <input type="hidden" name="prefecture" value={prefecture} />
        <select
          value={prefecture}
          onChange={(e) => setPrefecture(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
        >
          <option value="">未設定</option>
          {PREFECTURES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FormLabel htmlFor="bio">自己紹介</FormLabel>
        <FormTextarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={provider.bio || ""}
        />
      </div>

      {/* 連絡方法 */}
      <ContactMethodToggles
        state={contactMethod}
        onChange={setContactMethod}
        showValidationError={!!error && !contactMethod.lineEnabled && !contactMethod.emailEnabled && !contactMethod.phoneEnabled}
      />

      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="is_listed"
            value="1"
            checked={isListed}
            onChange={(e) => setIsListed(e.target.checked)}
            className="h-5 w-5 rounded border-border text-accent accent-accent"
          />
          <div>
            <span className="text-sm font-medium">「事業主を探す」ページに公開する</span>
            <p className="text-xs text-muted">ONにすると探すページの一覧に表示されます</p>
          </div>
        </label>
      </div>

      <div>
        <FormLabel htmlFor="brand_color">
          ブランドカラー
          <span className="ml-1 text-xs text-muted">（LINE通知のアクセントカラー）</span>
        </FormLabel>
        <div className="flex items-center gap-3">
          <input
            id="brand_color"
            name="brand_color"
            type="color"
            defaultValue={provider.brand_color || brand.primary}
            className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-card p-0.5"
          />
          <span className="text-sm text-muted">通知メッセージのボタンやバッジに使用されます</span>
        </div>
      </div>

      {error && (
        <Alert type="error">{error}</Alert>
      )}
      {success && (
        <Alert type="success">✓ 保存しました</Alert>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60 active:scale-[0.98]"
      >
        {submitting && (
          <Spinner size="sm" className="border-white border-t-transparent" />
        )}
        {submitting ? "処理中..." : "保存する"}
      </button>
    </form>
    </>
  );
}
