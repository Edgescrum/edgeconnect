"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/provider";
import Image from "next/image";

interface Provider {
  id: number;
  name: string | null;
  bio: string | null;
  icon_url: string | null;
  line_contact_url: string;
}

export function ProfileEditForm({ provider }: { provider: Provider }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar */}
      <div className="flex justify-center">
        <label className="group relative cursor-pointer">
          {provider.icon_url ? (
            <Image
              src={provider.icon_url}
              alt=""
              width={80}
              height={80}
              className="rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white shadow-md">
              {(provider.name || "?")[0]}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
            変更
          </div>
          <input
            name="icon"
            type="file"
            accept="image/*"
            className="hidden"
          />
        </label>
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
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="line_contact_url" className="mb-1.5 block text-sm font-medium">
          連絡用LINE URL
        </label>
        <input
          id="line_contact_url"
          name="line_contact_url"
          type="url"
          defaultValue={provider.line_contact_url}
          required
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
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
        className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-40 active:scale-[0.98]"
      >
        {submitting ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
