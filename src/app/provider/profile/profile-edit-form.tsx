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

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await updateProfile(formData);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="flex justify-center">
        {provider.icon_url ? (
          <Image
            src={provider.icon_url}
            alt=""
            width={80}
            height={80}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-xl text-gray-500">
            {(provider.name || "?")[0]}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          屋号
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={provider.name || ""}
          required
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium">
          プロフィール文
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={provider.bio || ""}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="icon" className="mb-1 block text-sm font-medium">
          アイコン画像を変更
        </label>
        <input
          id="icon"
          name="icon"
          type="file"
          accept="image/*"
          className="w-full"
        />
      </div>

      <div>
        <label
          htmlFor="line_contact_url"
          className="mb-1 block text-sm font-medium"
        >
          個人LINE URL
        </label>
        <input
          id="line_contact_url"
          name="line_contact_url"
          type="url"
          defaultValue={provider.line_contact_url}
          required
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">保存しました</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-black py-3 font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
