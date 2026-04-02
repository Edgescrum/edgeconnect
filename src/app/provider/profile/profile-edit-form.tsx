"use client";

import { useState, useRef } from "react";
import { updateProfile } from "@/lib/actions/provider";
import Image from "next/image";

interface Provider {
  id: number;
  name: string | null;
  bio: string | null;
  icon_url: string | null;
  line_contact_url: string;
  contact_email: string | null;
}

export function ProfileEditForm({ provider }: { provider: Provider }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(
    provider.icon_url
  );
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIconPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    // 楽観的: 即座にsuccessを表示
    setSuccess(true);
    try {
      const formData = new FormData(e.currentTarget);
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
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
          <input
            ref={fileRef}
            name="icon"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </button>
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

      <div>
        <label htmlFor="line_contact_url" className="mb-1.5 block text-sm font-medium">
          連絡用LINE URL
          <span className="ml-1 text-xs text-muted">（任意）</span>
        </label>
        <input
          id="line_contact_url"
          name="line_contact_url"
          type="url"
          defaultValue={provider.line_contact_url || ""}
          className="w-full rounded-xl border border-border bg-card px-4 py-3"
        />
      </div>

      <div>
        <label htmlFor="contact_email" className="mb-1.5 block text-sm font-medium">
          連絡用メールアドレス
          <span className="ml-1 text-xs text-muted">（任意）</span>
        </label>
        <input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={provider.contact_email || ""}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-border bg-card px-4 py-3"
        />
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
  );
}
